import { signIn, signOut, useSession, SessionProvider } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import { type NextPage } from "next";
import {
  createContext,
  useContext,
  type FC,
  type FormEvent,
  useRef,
  useEffect,
  useState,
  ReactNode,
  ChangeEvent
} from "react";
import { Button, Card, Typography } from '@mui/material';
import Image from "next/image";
import Avatar from '../../public/avatar.jpg';
import ReactMarkdown from "react-markdown";
import { Document } from "~/server/api/routers/chroma";
import { TRPCClientError } from "@trpc/client";
import { ArrowUpCircleIcon } from '@heroicons/react/24/solid';
import { Disclosure, Tab, Transition } from '@headlessui/react';

type MessageType = {
  content: string;
  role: "user" | "assistant";
};


const AddDocumentForm: React.FC = () => {
  const [collectionIds, setCollectionIds] = useState<string[]>(["Create new collection"]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("Create new collection");
  const [newCollectionName, setNewCollectionName] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  const addDocsToCollection = api.chroma.addDocsToCollection.useMutation();
  const addTextToCollection = api.chroma.addTextToCollection.useMutation();
  const createCollectionFromDoc = api.chroma.createCollectionFromDoc.useMutation();
  const createCollectionFromText = api.chroma.createCollectionFromText.useMutation();

  const handleCollectionChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setSelectedCollectionId(event.target.value);
    if (event.target.value === "Create new collection") {
      setNewCollectionName("");
    }
  };

  const handleUpload = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const collectionId = selectedCollectionId === "Create new collection" ? newCollectionName : selectedCollectionId;

    if (collectionIds.indexOf(collectionId) === -1){
      setCollectionIds([...collectionIds, collectionId]);
    }
    
    // Prepare documents
    const documents = [
      {
        pageContent: text,
        metadata: {}
      },
    ];

    console.log("Submitted")

    if (selectedCollectionId !== "Create new collection" && file){
      addDocsToCollection.mutateAsync({
        collection: collectionId,
        documents: documents,
      })
        .then((response) => {
          console.log(response);
        })
        .catch((error: TRPCClientError<any>) => {
          console.error("Error uploading document", error);
        });
    } else if (selectedCollectionId !== "Create new collection" && text){
      addTextToCollection.mutateAsync({
        collection: collectionId,
        texts: [text],
        metadatas: [{}]
      })
        .then((response) => {
          console.log(response);
        })
        .catch((error: TRPCClientError<any>) => {
          console.error("Error uploading document", error);
        });
    } else if (selectedCollectionId === "Create new collection" && text){
      console.log("Creating collection from text")
      createCollectionFromText.mutateAsync({
        collection: collectionId,
        texts: [text],
        ids: [{id: 1}]
      })
        .then((response) => {
          console.log(response);
        })
        .catch((error: TRPCClientError<any>) => {
          console.error("Error creating collection from document", error);
        });
    } 
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = event.target.files && event.target.files.length > 0 ? event.target.files[0] : null;
    setFile((selectedFile as File | null));
  };
  

  return (
    <div className="w-full max-w-md mx-auto">
      <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleUpload}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collectionId">
            Collection ID
          </label>
          <select
            id="collectionId"
            value={selectedCollectionId}
            onChange={handleCollectionChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {collectionIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>
        {selectedCollectionId === "Create new collection" && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newCollectionName">
              New Collection Name
            </label>
            <input
              id="newCollectionName"
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
        )}

        <Tab.Group selectedIndex={tabIndex} onChange={setTabIndex}>
          <Tab.List className="flex p-1 space-x-1 bg-blue-900 rounded-xl">
            <Tab className={`w-full py-2.5 text-sm leading-5 font-medium rounded-lg
              focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60 
              ${tabIndex === 0 ? 'bg-white text-blue-700' : 'text-white'}`}>
              Enter Text
            </Tab>
            <Tab className={`w-full py-2.5 text-sm leading-5 font-medium rounded-lg 
              focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60
              ${tabIndex === 1 ? 'bg-white text-blue-700' : 'text-white'}`}>
              Upload Document
            </Tab>
          </Tab.List>

          <Tab.Panel className="mt-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="text">
              Text
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </Tab.Panel>

          <Tab.Panel className="mt-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file">
              Upload Document
            </label>
            <input
              id="file"
              type="file"
              onChange={handleFileChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </Tab.Panel>
        </Tab.Group>

        <div className="flex items-center justify-between mt-4">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
            <ArrowUpCircleIcon className="h-5 w-5 mr-2 inline-block" />
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

const MessagesContext = createContext<Array<MessageType>>(
  [] as Array<MessageType>
);
// eslint-disable-next-line @typescript-eslint/no-empty-function
const SetMessagesContext = createContext((_messages: Array<MessageType>) => {});

const ProcessingContext = createContext<boolean>(false);
// eslint-disable-next-line @typescript-eslint/no-empty-function
const SetProcessingContext = createContext((_processing: boolean) => {});

const TokenCountContext = createContext<number>(0);
// eslint-disable-next-line @typescript-eslint/no-empty-function
const SetTokenCountContext = createContext((_tokenCount: number) => {});

const PushChatMessageForm: FC<React.HTMLAttributes<HTMLFormElement>> = ({
  ...props
}) => {
  const [message, setMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [similarText, setSimilarText] = useState<string>("");
  const [queryKey, setQueryKey] = useState<number>(0);  // add this state variable

  
  const textQuery = api.chroma.queryCollection.useQuery(
    {collection: 'Quantitative_Easing', text: message, similarDocs: 1},
    {refetchOnWindowFocus: false, enabled: false}
  );

  

  const messages = useContext(MessagesContext);
  const setMessages = useContext(SetMessagesContext);

  const isProcessing = useContext(ProcessingContext);
  const setIsProcessing = useContext(SetProcessingContext);

  const setTokenCount = useContext(SetTokenCountContext);

  const sendChatMessage = api.chat.send.useMutation();

  const isTypingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const maxLength = 500;
  const minLength = 10;

  const handleSubmit = async () => {
    const messagesProxy = messages;

    const result = await textQuery.refetch();
    
    console.log(result);
    console.log(result.isSuccess);
    // check if data has been fetched
    if (result.isSuccess) {
      setSimilarText(result.data?.pageContents.join('\n') ?? "");
      console.log(result);
      console.log(result.data?.pageContents.join('\n') ?? "");
    }
    
    if (
      message.length > minLength &&
      message.length <= maxLength &&
      !isProcessing
    ) {
      messagesProxy.push({ content: message, role: "user" });
      setMessages([...messagesProxy]);
    } else {
      if (message.length < minLength) {
        alert("Message is too short");
      }

      if (message.length > maxLength) {
        alert("Message is too long");
      }

      if (isProcessing) {
        alert("Wait for Virtual Vince to answer");
      }

      return;
    }

    setMessage("");
    setIsTyping(false);

    setTimeout(() => {
      setIsProcessing(true);
    }, 750);

    await sendChatMessage
      .mutateAsync({ messages: messagesProxy, context: result.data?.pageContents.join('\n') ?? "" })
      .then((response) => {
        if (response) {
          messagesProxy.push(response.message as MessageType);
          setTokenCount(response.total_tokens as number);
          setMessages([...messagesProxy]);
          setIsProcessing(false);
        }
      });
  };

  const handleInput = (e: FormEvent<HTMLTextAreaElement>) => {
    setMessage(e.currentTarget.value);
    setIsTyping(true);

    if (isTypingTimerRef.current) clearTimeout(isTypingTimerRef.current);

    isTypingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  return (
    <form
      className={`flex w-full flex-col ${props.className ?? ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <span className="h-6 flex-none text-sm">
        {isTyping ? "Typing..." : ""}
      </span>
      <div className="flex w-full flex-1 flex-row gap-x-2 rounded-xl bg-neutral-100 p-3 text-neutral-600 shadow-sm">
        <textarea
          rows={
            message.split(/\r|\n/).length > 3
              ? message.split(/\r|\n/).length
              : 3
          }
          className="flex-1 border-none bg-transparent focus:outline-none"
          value={message}
          onInput={(e) => handleInput(e)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSubmit();
            }
          }}
        />

        <div className="flex h-full flex-col items-end justify-between">
          <button
            className="rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={message.length > maxLength || message.length < minLength}
          >
            Send
          </button>
          <span
            className={`text-sm leading-none ${
              message.length > maxLength ? "text-red-500" : "text-neutral-400"
            }`}
          >
            {" "}
            {message.length.toString() + "/" + maxLength.toString()}{" "}
          </span>
        </div>
      </div>
    </form>
  );
};

const ChatMessages: FC<React.HTMLAttributes<HTMLUListElement>> = ({
  ...props
}) => {
  const messages = useContext(MessagesContext);
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const processing = useContext(ProcessingContext);

  useEffect(() => {
    if (scrollTargetRef.current) {
      scrollTargetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  });

  return (
    <ul className={`flex flex-col gap-y-3 ${props.className ?? ""}`}>
      {messages.map((message, index) => (
        <li key={index} className="flex w-full flex-row items-end gap-x-2">
          {message.role === "assistant" && (
            <div className="object-fit relative block h-10 w-10 flex-none overflow-hidden rounded-full bg-neutral-200">
              <Image
                src={
                  Avatar
                }
                alt="Assistant"
                fill
                priority
              />
            </div>
          )}
          <div
            className={`prose flex-1 break-words rounded-2xl px-6 py-4 text-sm shadow-sm md:text-base ${
              message.role === "assistant"
                ? "mr-16 bg-neutral-200 text-neutral-900 sm:mr-32"
                : "ml-16 bg-blue-500 text-white sm:ml-32"
            }`}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </li>
      ))}
      {processing && (
        <li className="flex w-full flex-row items-end gap-x-1">
          <div className="object-fit relative block h-10 w-10 flex-none overflow-hidden rounded-full bg-neutral-200">
            <Image
              src={
                Avatar
              }
              alt="Assistant"
              fill
              priority
            />
          </div>
          <div
            className={`mr-14 w-fit rounded-2xl bg-neutral-200 px-6 py-4 text-sm text-neutral-900 shadow-sm sm:mr-32 md:text-base`}
          >
            <div className="flex animate-pulse gap-x-1">
              <div className="h-2 w-2 rounded-full bg-gray-500"></div>
              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
              <div className="h-2 w-2 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </li>
      )}
      <div ref={scrollTargetRef}></div>
    </ul>
  );
};

type OpenAIContextType = {
  openAIKey: string | null,
  setOpenAIKey: (value: string | null) => void
}

type ProviderProps = {
  children: ReactNode
}

const OpenAIContext = createContext<OpenAIContextType | undefined>(undefined);

const OpenAIProvider: FC<ProviderProps> = ({ children }) => {
  const [openAIKey, setOpenAIKey] = useState<string | null>(null);

  return (
    <OpenAIContext.Provider value={{ openAIKey, setOpenAIKey }}>
      {children}
    </OpenAIContext.Provider>
  );
}

function useOpenAIKey(): OpenAIContextType {
  const context = useContext(OpenAIContext);
  if (context === undefined) {
    throw new Error('useOpenAIKey must be used within a OpenAIProvider')
  }
  return context;
}


function AuthShowcase() {
  const { openAIKey, setOpenAIKey } = useOpenAIKey();
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );

  const handleSignIn = () => {
    const key = prompt("Please enter your OpenAI API key:");
    if (key) {
      setOpenAIKey(key);
      signIn();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-black">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-black no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : handleSignIn} // Here, instead of directly calling signIn, we now call handleSignIn
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}

const Home: NextPage = () => {
  const [messages, setMessages] = useState<Array<MessageType>>([]);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [processing, setProcessing] = useState<boolean>(true);

  const welcome = api.chat.welcome.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (welcome.data) {
      setMessages([welcome.data.message as MessageType]);
      setProcessing(false);
    }
  }, [welcome.data]);

  const { data: session } = useSession();

  if (session) {
    return (
      <>
      <OpenAIProvider>
        <p>Welcome, {session.user.name}!</p>
        <button onClick={() => signOut()}>Sign out</button>
      <Head>
        <title>Athena.ai</title>
        <meta name="description" content="Athena.ai - your personal knowledge assistant." />
      </Head>
      <main className="mx-auto flex h-screen flex-col bg-white p-5 md:px-0">
      <div className="flex justify-between items-center">  {/* Add this line */}
          <div className="flex-none">
            <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl md:text-4xl">
              Athena.ai
            </h1>
            <p className="text-sm text-neutral-800 sm:text-base">
              Welcome to Athena.ai, your personal knowledge assistant.
            </p>
          </div>
          <AuthShowcase /> {/* Move AuthShowcase component here */}
        </div>
        <div className="flex flex-row flex-1 mt-5 overflow-y-auto">
          <div className="w-1/4 p-4">
            <AddDocumentForm />
          </div>
          <div className="w-3/4 p-4 flex flex-col">
            <ProcessingContext.Provider value={processing}>
              <SetProcessingContext.Provider value={setProcessing}>
                <MessagesContext.Provider value={messages}>
                  <SetMessagesContext.Provider value={setMessages}>
                    <SetTokenCountContext.Provider value={setTokenCount}>
                      <TokenCountContext.Provider value={tokenCount}>
                        <ChatMessages className="flex-grow overflow-y-auto" />
                        <PushChatMessageForm className="flex-none" />
                      </TokenCountContext.Provider>
                    </SetTokenCountContext.Provider>
                  </SetMessagesContext.Provider>
                </MessagesContext.Provider>
              </SetProcessingContext.Provider>
            </ProcessingContext.Provider>
          </div>
        </div>
      </main>
    </OpenAIProvider>
    </>
  )
  } else {
    return (
      <>
        <OpenAIProvider> {/* Wrap your login form with the OpenAIProvider */}
          <Head>
            <title>Login | Athena.ai</title>
          </Head>
          <div className="flex items-center justify-center h-screen bg-gray-100">
            <Card className="p-10">
              <Typography variant="h4" className="mb-6">Welcome to Athena.ai</Typography>
              <Typography variant="subtitle1" className="mb-10">Please sign in to continue</Typography>
              <Button variant="contained" color="primary" style={{ color: "black" }} onClick={() => signIn()}>Sign in</Button>
            </Card>
          </div>
        </OpenAIProvider>
      </>
    )
  }
};

export default Home;
