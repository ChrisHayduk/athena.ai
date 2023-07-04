import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { Chroma } from "langchain/vectorstores/chroma";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { VectorStore } from "langchain/dist/vectorstores/base";

interface DocumentInput<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Metadata extends Record<string, any> = Record<string, any>
> {
  pageContent: string;

  metadata?: Metadata;
}

/**
 * Interface for interacting with a document.
 */
export class Document<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Metadata extends Record<string, any> = Record<string, any>
> implements DocumentInput<Metadata>
{
  pageContent: string;

  metadata: Metadata;

  constructor(fields: DocumentInput<Metadata>) {
    this.pageContent = fields.pageContent ? fields.pageContent.toString() : '';
    this.metadata = fields.metadata ?? ({} as Metadata);
  }
}

const client_url = "http://" + (process.env.CHROMA_SERVER_HOST || "localhost") + ":" + (process.env.CHROMA_SERVER_HTTP_PORT || "8000");

console.log(client_url);

export const chromaRouter = createTRPCRouter({
    queryCollection: publicProcedure
    .input(
        z.object({
            collection: z.string(),
            text: z.string(),
            similarDocs: z.number()
        })).query(async (req) => {
        
        const vectorStore = await Chroma.fromExistingCollection(
                new OpenAIEmbeddings(),
                { collectionName: req.input.collection,
                  url: client_url
                }
        );

        const response = await vectorStore.similaritySearch(req.input.text, req.input.similarDocs);

              
        const pageContents = response.map(document => document.pageContent);
        const documentIds = response.filter(document => document.metadata.id).map(document => document.metadata.id as string);
    
        return {
          pageContents: pageContents,
          documentIds: documentIds
        };
      }),
    
    createCollectionFromDoc: publicProcedure
    .input(
      z.object({
            docPath: z.string(),
            collection: z.string(),
      })
    )
    .mutation(async (req) => {
        const loader = new TextLoader(req.input.docPath);
        const docs = await loader.load();
        
        // Create vector store and index the docs
        const vectorStore = await Chroma.fromDocuments(docs, new OpenAIEmbeddings(), {
          collectionName: req.input.collection,
          url: client_url
        });

      return (vectorStore)
    }),

    createCollectionFromText: publicProcedure
    .input(
      z.object({
            texts: z.array(z.string()),
            ids: z.array(z.object({id: z.number()})),
            collection: z.string(),
      })
    )
    .mutation(async (req) => {
        const vectorStore = await Chroma.fromTexts(
            req.input.texts,
            req.input.ids,
            new OpenAIEmbeddings(),
            {
              collectionName: req.input.collection,
              url: client_url
            }
          );
          

      return (vectorStore)
    }),

    addDocsToCollection: publicProcedure
    .input(
    z.object({
        documents: z.array(z.object({
        pageContent: z.string(),
        metadata: z.object({})
        })),
        collection: z.string(),
    })
    )
    .mutation(async (req) => {
        const vectorStore = await Chroma.fromExistingCollection(
            new OpenAIEmbeddings(),
            { collectionName: req.input.collection,
              url: client_url
            }
        );

        await vectorStore.addDocuments(req.input.documents);

        return { status: 'Documents added successfully' };
    }),

    
    addTextToCollection: publicProcedure
    .input(
    z.object({
        texts: z.array(z.string()),
        metadatas: z.array(z.object({})), // Assumes one metadata object per text
        collection: z.string(),
    })
    )
    .mutation(async (req) => {
        const documents = req.input.texts.map((text, index) => new Document({
            pageContent: text,
            metadata: req.input.metadatas[index] // Matches each text with corresponding metadata
        }));

        const vectorStore = await Chroma.fromExistingCollection(
            new OpenAIEmbeddings(),
            { collectionName: req.input.collection,
              url: client_url
            }
        );

        await vectorStore.addDocuments(documents);

        return { status: 'Texts added successfully' };
    }),
});