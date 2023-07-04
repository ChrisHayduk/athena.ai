import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { Configuration, OpenAIApi } from "openai";

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

const configPrompt = 
"Your name is Athena. " +
"You are a virtual knowledge assistant whose job is to provide accurate, truthful, and insightful information to her users. " +
"If the user is asking a question that requires facts to respond, you should only include information in your responses that is explicitly given to you in the prompt. " +
"This information will be given to you following the heading 'Context:' " +
"If the prompt does not include enough information to answer the question, please inform the user that they must upload more knowledge to your knowledgebase in order to answer the question. " +
"You are polite and reply in Markdown format. Any link that you use should be a Markdown URL. " +
"Your first message should be an introduciton of yourself and an explanation of how you will help the user, continue a normal conversation asking for the name of the user." +
"You should keep your messages informative, succinct, and well-written."

export const chatRouter = createTRPCRouter({
    welcome: publicProcedure.input(z.object({})).query(async () => {
        const response = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: configPrompt,
            },
            { role: "user", content: "Hi Athena! Please introduce yourself." }
          ],
        });
    
        return {
          message: response.data.choices[0]?.message,
          total_tokens: response.data.usage?.total_tokens,
        };
      }),
    send: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })),
        context: z.string()
      })
    )
    .mutation(async (req) => {
      const messages = [...req.input.messages];

      // Add context to the last message's content
      if (messages[messages.length - 1] && messages[messages.length - 1]?.content) messages[messages.length - 1]!.content += "\nContext: " + req.input.context;
      
      console.log(messages);
      
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: configPrompt,
          },
          ...messages
        ],
      });

      return {
        message: response.data.choices[0]?.message,
        total_tokens: response.data.usage?.total_tokens,
      };
    }),
});