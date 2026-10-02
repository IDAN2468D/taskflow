'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Award, Plus, CheckCircle, Search, Shield, Zap, Sparkles } from 'lucide-react';

interface SkillItem {
  id: string;
  name: string;
  category: string;
  level: 'EXPERT' | 'INTERMEDIATE' | 'BEGINNER';
  endorsedByAI: boolean;
}

const initialSkills: SkillItem[] = [
  { id: '1', name: 'Spring Boot 3 & Java 21', category: 'Backend', level: 'EXPERT', endorsedByAI: true },
  { id: '2', name: 'Apache Kafka & Event Streaming', category: 'DevOps / Architecture', level: 'EXPERT', endorsedByAI: true },
  { id: '3', name: 'Next.js 15 & React 19', category: 'Frontend', level: 'EXPERT', endorsedByAI: true },
  { id: '4', name: 'Elasticsearch 8 & Vector Search', category: 'Data & Search', level: 'INTERMEDIATE', endorsedByAI: false },
  { id: '5', name: 'gemini-3.5-flash-lite Integration', category: 'AI & ML', level: 'EXPERT', endorsedByAI: true },
  { id: '6', name: 'Docker & Kubernetes', category: 'Cloud & Infrastructure', level: 'INTERMEDIATE', endorsedByAI: false },
];

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillItem[]>(initialSkills);
  const [searchTerm, setSearchTerm] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Backend');

  const filteredSkills = skills.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSkill = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const newSkill: SkillItem = {
      id: String(Date.now()),
      name: newSkillName.trim(),
      category: newSkillCategory,
      level: 'INTERMEDIATE',
      endorsedByAI: true,
    };

    setSkills([newSkill, ...skills]);
    setNewSkillName('');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onSearchChange={setSearchTerm} />

        <main className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full space-y-8">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                מטריצת מיומנויות חכמה (Skill Matrix)
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight">ניהול ומיפוי מיומנויות לשידוך משימות</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                סוכן ה-AI של TaskFlow מצליב את דרישות המשימות שהוגדרו עם מיומנויות הצוות כדי להקצות משימות בצורה אופטימלית.
              </p>
            </div>
          </div>

          {/* Add Skill Bar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-600" />
              הוספת מיומנות חדשה
            </h3>
            <form onSubmit={handleAddSkill} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="שם המיומנות (למשל: PostgreSQL, Redis, GraphQL)..."
                className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
              />
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
              >
                <option value="Backend">Backend</option>
                <option value="Frontend">Frontend</option>
                <option value="DevOps / Architecture">DevOps / Architecture</option>
                <option value="AI & ML">AI & ML</option>
                <option value="Data & Search">Data & Search</option>
                <option value="Security">Security</option>
              </select>
              <button
                type="submit"
                disabled={!newSkillName.trim()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>הוסף מיומנות</span>
              </button>
            </form>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                      {skill.category}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">{skill.name}</h4>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Award className="h-5 w-5" />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                    {skill.level}
                  </span>
                  {skill.endorsedByAI && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle className="h-3.5 w-3.5" />
                      מאומת על ידי AI
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
