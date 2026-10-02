'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Settings, Shield, Bell, Database, Cpu, Check, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api');
  const [kafkaEnabled, setKafkaEnabled] = useState(true);
  const [geminiModel, setGeminiModel] = useState('gemini-3.5-flash-lite');

  const handleSave = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">הגדרות מערכת</h2>
            <p className="text-xs text-slate-500">תצורת תקשורת צד שרת, אינטגרציות AI ושירותי Kafka</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* User Details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-600" />
                פרופיל משתמש
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">שם מלא / כינוי</label>
                  <input
                    type="text"
                    disabled
                    value={user?.fullName || user?.username || 'משתמש מחובר'}
                    className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">דוא״ל</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'admin@taskflow.local'}
                    className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Backend & Microservices */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-600" />
                חיבור שרתי Backend & Event Streaming
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">כתובת ה-API של Spring Boot</label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <Bell className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">האזנה להתראות בזמן אמת (Kafka WebSocket)</p>
                      <p className="text-[11px] text-slate-500">קבלת עדכוני סטטוס משימות בזמן אמת מ-Kafka Producer</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={kafkaEnabled}
                    onChange={(e) => setKafkaEnabled(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* AI Model Configuration */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-600" />
                מודל הבינה המלאכותית (gemini-3.5-flash-lite)
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">מודל פעיל</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (ברירת מחדל מהירה וחסכונית)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (לפירוק משימות מורכבות)</option>
                  <option value="local-fallback">Offline Smart Decomposition (ללא מפתח API)</option>
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {saved && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  ההגדרות נשמרו בהצלחה!
                </span>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>שמור שינויים</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
