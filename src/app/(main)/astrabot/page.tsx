"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faTrash } from "@fortawesome/free-solid-svg-icons";

interface Message {
    id: number;
    message: string;
    sender: "user" | "bot";
}

interface Chat {
    chatId: string;
    title: string;
    messages: Message[];
}

export default function AstraBot() {
    const [input, setInput] = useState("");
    const [botThinking, setBotThinking] = useState(false);
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedChatId, chats]);

    const fetchChats = async () => {
        try {
            const response = await fetch("/api/astrabot/fetch-chats");
            const data = await response.json();
            
            if (data.chats.length > 0) {
                setChats(data.chats);
            } else {
                await createNewChat();
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
        }
    };

    const createNewChat = async () => {
        try {
            const response = await fetch("/api/astrabot/create-new-chat", {
                method: "POST",
            });
            const data = await response.json();
            const newChat: Chat = { chatId: data.chatId, title: data.title, messages: [] };
            
            setChats((prev) => [...prev, newChat]);
            setSelectedChatId(newChat.chatId);
            
            simulateBotResponse("Hello! How can I assist you today?", newChat.chatId);
        } catch (error) {
            console.error("Error creating a new chat:", error);
        }
    };

    const deleteChat = async (chatId: string) => {
        try {
            await fetch("/api/astrabot/delete-chat", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatId }),
            });

            setChats((prev) => prev.filter((chat) => chat.chatId !== chatId));

            if (selectedChatId === chatId) {
                setSelectedChatId(chats.length > 1 ? chats[0].chatId : null);
            }
        } catch (error) {
            console.error("Error deleting chat:", error);
        }
    };

    const selectedChat = chats.find((chat) => chat.chatId === selectedChatId) || null;

    const sendMessage = async () => {
        if (input.trim() === "" || !selectedChat) return;

        const newMessage: Message = {
            id: selectedChat.messages.length + 1,
            message: input,
            sender: "user",
        };

        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat.chatId === selectedChat.chatId
                    ? { ...chat, messages: [...chat.messages, newMessage] }
                    : chat
            )
        );

        setInput("");
        setBotThinking(true);

        try {
            const response = await fetch("/api/astrabot/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: input, chatId: selectedChatId }),
            });

            const data = await response.json();
            setBotThinking(false);

            if (data.error) {
                simulateBotResponse("I'm sorry, I encountered an error.", selectedChatId as string);
            } else {
                simulateBotResponse(data.response, selectedChatId as string);
            }
        } catch (error) {
            console.error("Error sending message to AstraBot:", error);
            setBotThinking(false);
            simulateBotResponse("I'm sorry, I encountered an error.", selectedChatId as string);
        }
    };

    const simulateBotResponse = (fullText: string, chatId: string) => {
        let index = 0;
        let tempText = "";

        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat.chatId === chatId
                    ? { ...chat, messages: [...chat.messages, { id: chat.messages.length + 1, message: "", sender: "bot" }] }
                    : chat
            )
        );

        const updateMessage = () => {
            if (index < fullText.length) {
                tempText += fullText[index];
                setChats((prevChats) =>
                    prevChats.map((chat) =>
                        chat.chatId === chatId
                            ? {
                                  ...chat,
                                  messages: chat.messages.map((msg, idx) =>
                                      idx === chat.messages.length - 1 ? { ...msg, message: tempText } : msg
                                  ),
                              }
                            : chat
                    )
                );
                index++;
                requestAnimationFrame(updateMessage);
            }
        };

        requestAnimationFrame(updateMessage);
    };

    return (
        <div className="w-full h-full bg-gray-800 grid grid-cols-[20%_auto] p-4">
            <div className="w-full h-full flex justify-center items-center bg-gray-950 rounded-l-lg">
                <div className="w-full h-full grid grid-rows-[8%_auto]">
                    <div className="w-full h-full flex justify-center items-center">
                        <h3 className="text-white text-xl font-sans font-bold capitalize">
                            Chat History
                        </h3>
                    </div>
                    <div className="w-full h-full grid grid-rows-[50px_auto]">
                        <div className="w-full h-full flex justify-center items-center p-2 px-10">
                            <button className="w-full h-full bg-white rounded-full text-black capitalize font-bold font-sans hover:bg-gray-100" onClick={() => createNewChat()}>+ new chat</button>
                        </div>
                        <div className="w-full h-full flex justify-start items-center flex-col overflow-y-scroll no-scrollbar p-4 gap-y-2">

                            {
                                chats.map((chat) => (
                                    <div className={`w-full h-12 grid grid-cols-[auto_40px] ${selectedChatId === chat.chatId ? "bg-gray-800" : "hover:bg-gray-700 bg-transparent border-2 border-gray-800 hover:bg-opacity-30"} cursor-pointer rounded-md`} key={chat.chatId} onClick={() => setSelectedChatId(chat.chatId)}>
                                        <div className="w-full h-full text-white font-medium font-sans capitalize text-center flex justify-center items-center flex-nowrap overflow-x-hidden">
                                            {chat.title}
                                        </div>

                                        <button className="w-full h-full flex justify-center items-center">
                                            <FontAwesomeIcon icon={faTrash} className="text-red-500 text-lg hover:text-red-400" onClick={(e) => {
                                                e.stopPropagation();
                                                deleteChat(chat.chatId);
                                            }} />
                                        </button>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full h-full flex justify-center items-start p-4 bg-gray-900 rounded-r-lg">
                <div className="w-full h-full max-h-[630px] px-4 overflow-y-scroll no-scrollbar">
                    <div className="w-full h-full">
                        {selectedChat?.messages.map((message) => (
                            <div
                                key={message.id}
                                className={`w-full flex ${
                                    message.sender === "user" ? "justify-end" : "justify-start"
                                }`}
                            >
                                <div
                                    className={`w-auto max-w-[500px] h-auto p-3 rounded-lg text-white my-2 ${
                                        message.sender === "user"
                                            ? "bg-gradient-to-br from-lime-600 to-green-600"
                                            : "bg-gradient-to-br from-sky-600 to-blue-600"
                                    }`}
                                >
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]} 
                                        components={{
                                            h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-lg font-medium mb-2">{children}</h3>,
                                            p: ({ children }) => <p className="mb-4">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc pl-5 mb-4">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal pl-5 mb-4">{children}</ol>,
                                            li: ({ children }) => <li className="mb-2">{children}</li>,
                                            table: ({ children }) => <table className="table-auto border-collapse border border-gray-900 my-4">{children}</table>,
                                            thead: ({ children }) => <thead className="bg-gray-900">{children}</thead>,
                                            tr: ({ children }) => <tr className="border border-gray-900">{children}</tr>,
                                            td: ({ children }) => <td className="border border-gray-900 p-2">{children}</td>,
                                            th: ({ children }) => <th className="border border-gray-900 p-2 font-bold">{children}</th>,
                                            code: ({ children }) => <code className="bg-gray-900 text-white px-2 py-1 rounded">{children}</code>,
                                        }}
                                    >
                                        {message.message}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {botThinking && (
                            <div className="w-full flex justify-start">
                                <div className="w-auto max-w-[500px] h-auto p-3 rounded-lg text-white bg-gradient-to-br from-sky-600 to-blue-600">
                                    <span className="animate-pulse">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className={`absolute bottom-10 w-full max-w-5xl bg-gray-800 rounded-xl shadow-xl flex items-end px-4 py-2 ${selectedChatId === null ? "hidden" : "block"}`}>
                    <textarea
                        ref={textareaRef}
                        className={`w-full min-h-[30px] max-h-[150px] bg-gray-800 text-white placeholder-gray-400 text-md resize-none focus:outline-none border-none overflow-hidden no-scrollbar`}
                        placeholder="Type a message..."
                        value={input}
                        rows={1}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        style={{
                            minHeight: "30px",
                            maxHeight: "150px",
                            overflowY: textareaRef.current && textareaRef.current.scrollHeight > 150 ? "auto" : "hidden",
                            transition: "height 0.2s ease-in-out",
                        }}
                    ></textarea>

                    <button
                        className="ml-3 text-blue-500 text-xl hover:text-blue-400 transition duration-200"
                        onClick={sendMessage}
                    >
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                </div>
            </div>
        </div>
    );
}