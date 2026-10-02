'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Sparkles, Send, Loader2, Bot, User, PlusCircle, CheckCircle2, Layers, Lightbulb } from 'lucide-react';
import { api } from '@/lib/api';
import { TaskPriority } from '@/types';

interface Message {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    subtasks?: string[];
    suggestedPriority?: TaskPriority;
    suggestedTitle?: string;
    timestamp: string;
}

const quickPrompts = [
    'פצל לי את משימת "הקמת Kafka Consumer להתראות משתמשים" לצעדים ברורים',
    'תכנן ארכיטקטורת אבטחת JWT ו-Spring Security 6 עבור ה-API',
    'שדך משימת "אופטימיזציה לחיפוש ב-Elasticsearch" לחבר צוות לפי מיומנויות',
];

export default function AiAgentPage() {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [addedTaskId, setAddedTaskId] = useState<string | null>(null);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init-1',
            sender: 'assistant',
            text: 'שלום! אני סוכן ה-AI של TaskFlow Pro, המופעל באמצעות מודל gemini-3.5-flash-lite. אני יכול לפרק משימות מורכבות, להמליץ על עדיפויות, ולייצר משימות ישירות ללוח ה-Kanban.',
            timestamp: 'עכשיו',
        },
    ]);

    const handleSend = async (textToSend?: string): Promise<void> => {
        const prompt = textToSend || input;
        if (!prompt.trim() || isLoading) return;

        const userMsg: Message = {
            id: String(Date.now()),
            sender: 'user',
            text: prompt,
            timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!textToSend) setInput('');
        setIsLoading(true);

        try {
            const res = await api.decomposeWithAI(prompt);
            const assistantMsg: Message = {
                id: String(Date.now() + 1),
                sender: 'assistant',
                text: `תוכנית הפעולה והשלבים שנותחו ע"י gemini-3.5-flash-lite:`,
                suggestedTitle: res.suggestedTitle || prompt,
                subtasks: res.subtasks?.map((s) => s.title) || [
                    'הגדרת סכמת נתונים ו-DTOs ב-Backend',
                    'מימוש Endpoint ב-Spring Controller',
                    'בדיקות יחידה ואינטגרציה',
                ],
                suggestedPriority: res.recommendedPriority || 'HIGH',
                timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch {
            const fallbackMsg: Message = {
                id: String(Date.now() + 1),
                sender: 'assistant',
                text: `הנה פירוק השלבים המומלץ עבור: "${prompt}"`,
                suggestedTitle: prompt,
                subtasks: [
                    'אפיון דרישות טכניות והגדרת ארכיטקטורה',
                    'פיתוח שירות ה-Backend ואינטגרציית בסיס הנתונים',
                    'בניית ממשק משתמש אינטראקטיבי ב-Next.js 15',
                    'בדיקות אינטגרציה ופריסה ב-Docker',
                ],
                suggestedPriority: 'HIGH',
                timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, fallbackMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportToKanban = async (msg: Message): Promise<void> => {
        if (!msg.suggestedTitle) return;
        try {
            await api.createTask({
                title: msg.suggestedTitle,
                description: msg.subtasks ? `תתי-משימות מבוססות AI:\n- ${msg.subtasks.join('\n- ')}` : '',
                priority: msg.suggestedPriority || 'HIGH',
                status: 'TODO',
                tags: ['AI-Generated', 'TaskFlow'],
            });
            setAddedTaskId(msg.id);
            setTimeout(() => setAddedTaskId(null), 3000);
        } catch (err) {
            console.warn('Error exporting to Kanban:', err);
        }
    };

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        void handleSend();
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header />
                <div className="flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto w-full p-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-4">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">סוכן AI חכם (gemini-3.5-flash-lite)</h2>
                            <p className="text-xs text-slate-500">פירוק משימות אוטומטי, שידוך מיומנויות ותעדוף חכם</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'assistant' && (
                                    <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-1">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                )}
                                <div className={`max-w-2xl rounded-3xl p-5 shadow-sm text-sm space-y-3 ${
                                    msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                                }`}>
                                    <p className="leading-relaxed">{msg.text}</p>
                                    {msg.subtasks && (
                                        <div className="mt-3 bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
                                            <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                                                <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-purple-600" /> {msg.suggestedTitle}</span>
                                                {msg.suggestedPriority && <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">{msg.suggestedPriority}</span>}
                                            </div>
                                            <div className="space-y-1.5">
                                                {msg.subtasks.map((st, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs text-purple-950 font-medium">
                                                        <span className="h-5 w-5 rounded-full bg-purple-200 text-purple-800 text-[10px] flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                                                        <span>{st}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="pt-2 border-t border-purple-200 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        void handleExportToKanban(msg);
                                                    }}
                                                    disabled={addedTaskId === msg.id}
                                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all disabled:bg-emerald-600"
                                                >
                                                    {addedTaskId === msg.id ? <><CheckCircle2 className="h-3.5 w-3.5" /> נוסף בהצלחה ל-Kanban!</> : <><PlusCircle className="h-3.5 w-3.5" /> הוסף משימה זו ל-Kanban</>}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <span className={`block text-[10px] mt-1 ${msg.sender === 'user' ? 'text-indigo-200 text-left' : 'text-slate-400 text-left'}`}>{msg.timestamp}</span>
                                </div>
                                {msg.sender === 'user' && (
                                    <div className="h-9 w-9 rounded-2xl bg-slate-800 flex items-center justify-center text-white shrink-0 mt-1">
                                        <User className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-2 items-center text-slate-400 text-xs py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                                <span>סוכן gemini-3.5-flash-lite מנתח ומפרק את המשימה...</span>
                            </div>
                        )}
                    </div>

                    <div className="py-2 flex items-center gap-2 overflow-x-auto">
                        <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1"><Lightbulb className="h-3 w-3 text-amber-500" /> הצעות:</span>
                        {quickPrompts.map((qp, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => {
                                    void handleSend(qp);
                                }}
                                className="shrink-0 text-xs px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                            >
                                {qp}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="pt-2 flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="כתוב משימה או שאלה לסוכן ה-AI..."
                            className="flex-1 px-5 py-3 text-sm bg-white border border-slate-200 rounded-2xl shadow-sm focus:border-purple-500 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white rounded-2xl font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5"
                        >
                            <Send className="h-4 w-4" />
                            <span>שלח</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}