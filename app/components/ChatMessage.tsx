import ReactMarkdown from 'react-markdown';



// Added a quick TypeScript interface for the message prop

export default function ChatMessage({ message }: { message: { content: string } }) {

  return (

    <div className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none">

      <ReactMarkdown>

        {message.content}

      </ReactMarkdown>

    </div>

  );

}

