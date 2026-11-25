'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  Bot,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCw,
  Eye,
  EyeOff,
  Sliders,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Send,
  Zap,
  Info,
  Check,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { GradeAgent, GeminiSettings, TONE_OPTIONS, GEMINI_MODELS } from '@/types/agent';
import { STUDENT_GRADES, getGradeBadgeStyle } from '@/types/student';
import toast from 'react-hot-toast';

const ALL_GRADES = ['General / All Grades', ...STUDENT_GRADES];

export function AgentsManagement() {
  // Settings State
  const [settings, setSettings] = useState<GeminiSettings>({
    gemini_model: 'gemini-3.5-flash',
    default_tone: 'Friendly & Welcoming',
    has_api_key: false,
    gemini_api_key_masked: ''
  });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Agents State
  const [agents, setAgents] = useState<GradeAgent[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('General / All Grades');
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isSavingAgent, setIsSavingAgent] = useState(false);

  // Current editing agent form state
  const [currentAgent, setCurrentAgent] = useState<Partial<GradeAgent>>({
    student_grade: 'General / All Grades',
    agent_name: 'HIS General School Counselor',
    tone: 'Friendly & Welcoming',
    custom_tone: '',
    knowledge_text: '',
    custom_instructions: '',
    model: 'gemini-3.5-flash',
    is_active: true
  });

  // Interactive Live Tester State
  const [testQuestion, setTestQuestion] = useState('');
  const [isTestingAgent, setIsTestingAgent] = useState(false);
  const [testResponse, setTestResponse] = useState<{
    reply: string;
    agentName: string;
    studentGrade: string;
  } | null>(null);

  // Load Settings and Agents on mount
  useEffect(() => {
    loadSettings();
    loadAgents();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const loadAgents = async () => {
    setIsLoadingAgents(true);
    try {
      const res = await fetch('/api/admin/agents');
      if (res.ok) {
        const data: GradeAgent[] = await res.json();
        setAgents(data);

        // Set active agent to match selected grade
        const matched = data.find((a) => a.student_grade === selectedGrade);
        if (matched) {
          setCurrentAgent(matched);
        } else if (data.length > 0) {
          setCurrentAgent(data[0]);
          setSelectedGrade(data[0].student_grade);
        }
      }
    } catch (e) {
      console.error('Failed to load agents:', e);
      toast.error('Failed to load grade agents');
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const handleSelectGrade = (grade: string) => {
    setSelectedGrade(grade);
    setTestResponse(null);
    const matched = agents.find((a) => a.student_grade === grade);
    if (matched) {
      setCurrentAgent({ ...matched });
    } else {
      setCurrentAgent({
        student_grade: grade,
        agent_name: `${grade} Academic Counselor`,
        tone: 'Friendly & Welcoming',
        custom_tone: '',
        knowledge_text: '',
        custom_instructions: '',
        model: settings.gemini_model || 'gemini-3.5-flash',
        is_active: true
      });
    }
  };

  // Save Gemini Key & Model Settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setKeyTestResult(null);
    try {
      const payload: Record<string, string> = {
        gemini_model: settings.gemini_model,
        default_tone: settings.default_tone
      };
      if (apiKeyInput.trim()) {
        payload.gemini_api_key = apiKeyInput.trim();
      }

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Gemini settings saved successfully!');
      setApiKeyInput('');
      await loadSettings();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Test Gemini API Key
  const handleTestApiKey = async () => {
    setIsTestingKey(true);
    setKeyTestResult(null);
    try {
      const res = await fetch('/api/admin/settings/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKeyInput.trim() || undefined,
          model: settings.gemini_model
        })
      });

      const data = await res.json();
      setKeyTestResult({
        success: Boolean(data.success),
        message: data.message || data.error || 'Connection failed'
      });

      if (data.success) {
        toast.success('Gemini API connection test passed!');
      } else {
        toast.error('Gemini connection failed. Check your API key.');
      }
    } catch (err: unknown) {
      setKeyTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network failure testing API key'
      });
      toast.error('Failed to test API key');
    } finally {
      setIsTestingKey(false);
    }
  };

  // Save Grade Agent
  const handleSaveAgent = async () => {
    if (!currentAgent.agent_name?.trim()) {
      toast.error('Agent Name is required');
      return;
    }

    if (!currentAgent.knowledge_text?.trim()) {
      toast.error('Please provide knowledge base text for this grade.');
      return;
    }

    setIsSavingAgent(true);
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentAgent,
          student_grade: selectedGrade
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save agent configuration');
      }

      toast.success(`Agent for "${selectedGrade}" saved successfully!`);
      await loadAgents();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error saving agent');
    } finally {
      setIsSavingAgent(false);
    }
  };

  // Test Agent with Gemini
  const handleTestAgent = async () => {
    if (!testQuestion.trim()) {
      toast.error('Please type a question to test the agent.');
      return;
    }

    setIsTestingAgent(true);
    setTestResponse(null);

    try {
      const res = await fetch('/api/admin/agents/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentGrade: selectedGrade,
          question: testQuestion.trim(),
          draftAgent: currentAgent,
          apiKey: apiKeyInput.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate test reply');
      }

      setTestResponse(data);
      toast.success('Test response received!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error testing agent');
    } finally {
      setIsTestingAgent(false);
    }
  };

  // Quick insertion helpers for knowledge text
  const appendTemplateSection = (title: string, template: string) => {
    const existing = currentAgent.knowledge_text || '';
    const addition = `\n\n### ${title}\n${template}`;
    setCurrentAgent((prev) => ({
      ...prev,
      knowledge_text: existing ? `${existing.trim()}${addition}` : addition.trim()
    }));
    toast.success(`Added ${title} section template`);
  };

  const wordCount = (currentAgent.knowledge_text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const charCount = (currentAgent.knowledge_text || '').length;

  return (
    <div className='space-y-8' suppressHydrationWarning>
      {/* 1. Gemini API Key & AI Settings Card */}
      <div className='bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden'>
        <div className='p-6 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/30 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md'>
              <Sparkles className='w-5 h-5' />
            </div>
            <div>
              <h3 className='text-lg font-bold text-gray-900'>
                Google Gemini API Configuration
              </h3>
              <p className='text-xs text-gray-500'>
                Powers intelligent, grounded answers for each grade stream
              </p>
            </div>
          </div>

          <div>
            {settings.has_api_key ? (
              <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600' />
                Gemini Active ({settings.gemini_api_key_masked})
              </span>
            ) : (
              <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200'>
                <AlertCircle className='w-3.5 h-3.5 text-amber-600' />
                API Key Not Configured
              </span>
            )}
          </div>
        </div>

        <div className='p-6 space-y-5'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* API Key Input */}
            <div>
              <label className='block text-xs font-semibold text-gray-700 mb-1.5'>
                Google Gemini API Key
              </label>
              <div className='relative'>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={
                    settings.has_api_key
                      ? `Leave blank to keep existing (${settings.gemini_api_key_masked})`
                      : 'Paste your Gemini API Key (starts with AIzaSy...)'
                  }
                  className='w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono transition-all'
                />
                <Key className='w-4 h-4 text-gray-400 absolute left-3 top-3.5' />
                <button
                  type='button'
                  onClick={() => setShowApiKey(!showApiKey)}
                  className='absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-0.5'
                  title={showApiKey ? 'Hide' : 'Show'}
                >
                  {showApiKey ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                </button>
              </div>
              <p className='text-[11px] text-gray-400 mt-1 flex items-center gap-1'>
                <Info className='w-3 h-3 shrink-0' />
                Get a free API key from Google AI Studio (aistudio.google.com)
              </p>
            </div>

            {/* Model & Fallback Tone */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-xs font-semibold text-gray-700 mb-1.5'>
                  AI Model
                </label>
                <select
                  value={settings.gemini_model}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      gemini_model: e.target.value
                    }))
                  }
                  className='w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white'
                >
                  {GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-xs font-semibold text-gray-700 mb-1.5'>
                  Default System Tone
                </label>
                <select
                  value={settings.default_tone}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      default_tone: e.target.value
                    }))
                  }
                  className='w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white'
                >
                  {TONE_OPTIONS.filter((t) => t.id !== 'Custom Tone').map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Test Result Banner */}
          {keyTestResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${
                keyTestResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {keyTestResult.success ? (
                <CheckCircle2 className='w-4 h-4 text-emerald-600 shrink-0 mt-0.5' />
              ) : (
                <AlertCircle className='w-4 h-4 text-rose-600 shrink-0 mt-0.5' />
              )}
              <div className='flex-1 font-mono break-all'>
                <strong>
                  {keyTestResult.success ? 'Success: ' : 'Failed: '}
                </strong>
                {keyTestResult.message}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100'>
            <button
              type='button'
              onClick={handleTestApiKey}
              disabled={isTestingKey}
              className='inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all disabled:opacity-50'
            >
              {isTestingKey ? (
                <RotateCw className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <Zap className='w-3.5 h-3.5 text-blue-600' />
              )}
              Test Connection
            </button>

            <button
              type='button'
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className='inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all disabled:opacity-50'
            >
              {isSavingSettings ? (
                <RotateCw className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <Save className='w-3.5 h-3.5' />
              )}
              Save Gemini Settings
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grade-Wise Agent Builder */}
      <div className='bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden'>
        <div className='p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50'>
          <div>
            <div className='flex items-center gap-2'>
              <Bot className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-bold text-gray-900'>
                Grade AI Agents & Knowledge Base
              </h3>
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              Select a grade stream to configure its dedicated AI agent, chatbot tone, and reference knowledge text.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-xs font-medium text-gray-500'>
              Agent Status:
            </span>
            <button
              type='button'
              onClick={() =>
                setCurrentAgent((prev) => ({
                  ...prev,
                  is_active: !prev.is_active
                }))
              }
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentAgent.is_active
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  currentAgent.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                }`}
              />
              {currentAgent.is_active ? 'Active' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Grade Selection Chips */}
        <div className='p-4 bg-gray-50/30 border-b border-gray-100 overflow-x-auto scrollbar-hide'>
          <div className='flex items-center gap-2 min-w-max'>
            {ALL_GRADES.map((grade) => {
              const isSelected = selectedGrade === grade;
              const hasConfig = agents.some(
                (a) => a.student_grade === grade && a.knowledge_text?.trim()
              );

              return (
                <button
                  key={grade}
                  onClick={() => handleSelectGrade(grade)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
                  }`}
                >
                  <GraduationCap
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-white' : 'text-gray-400'
                    }`}
                  />
                  <span>{grade}</span>
                  {hasConfig && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Agent Configuration Form */}
        <div className='p-6 space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Agent Name */}
            <div>
              <label className='block text-xs font-semibold text-gray-700 mb-1.5'>
                Agent Name / Role Title
              </label>
              <input
                type='text'
                value={currentAgent.agent_name || ''}
                onChange={(e) =>
                  setCurrentAgent((prev) => ({
                    ...prev,
                    agent_name: e.target.value
                  }))
                }
                placeholder='e.g., CBSE Academic Counselor'
                className='w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium transition-all'
              />
              <p className='text-[11px] text-gray-400 mt-1'>
                Name presented to parents in the chat widget header and answers.
              </p>
            </div>

            {/* Chatbot Tone Selector */}
            <div>
              <label className='block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between'>
                <span>Chatbot Tone</span>
                <span className='text-[11px] font-normal text-blue-600'>
                  {TONE_OPTIONS.find((t) => t.id === currentAgent.tone)
                    ?.description || ''}
                </span>
              </label>
              <select
                value={currentAgent.tone || 'Friendly & Welcoming'}
                onChange={(e) =>
                  setCurrentAgent((prev) => ({
                    ...prev,
                    tone: e.target.value
                  }))
                }
                className='w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white font-medium'
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} — {t.description}
                  </option>
                ))}
              </select>

              {currentAgent.tone === 'Custom Tone' && (
                <input
                  type='text'
                  value={currentAgent.custom_tone || ''}
                  onChange={(e) =>
                    setCurrentAgent((prev) => ({
                      ...prev,
                      custom_tone: e.target.value
                    }))
                  }
                  placeholder='Describe your custom tone (e.g., Cheerful, concise, highly enthusiastic)'
                  className='mt-2 w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all'
                />
              )}
            </div>
          </div>

          {/* Knowledge Base Text Area */}
          <div>
            <div className='flex flex-wrap items-center justify-between gap-2 mb-2'>
              <label className='block text-xs font-semibold text-gray-700 flex items-center gap-1.5'>
                <BookOpen className='w-4 h-4 text-blue-600' />
                <span>Knowledge Base Text (Strict Grounding Source)</span>
              </label>

              <div className='flex items-center gap-3 text-xs text-gray-400'>
                <span>
                  <strong>{wordCount}</strong> words
                </span>
                <span>•</span>
                <span>
                  <strong>{charCount}</strong> characters
                </span>
              </div>
            </div>

            <div className='relative'>
              <textarea
                rows={12}
                value={currentAgent.knowledge_text || ''}
                onChange={(e) =>
                  setCurrentAgent((prev) => ({
                    ...prev,
                    knowledge_text: e.target.value
                  }))
                }
                placeholder={`Paste the detailed information, curriculum syllabus, admission eligibility, fee structure, FAQs, and timings for ${selectedGrade} here...\n\nThe AI chatbot is strictly instructed to answer user questions exclusively from this text.`}
                className='w-full p-4 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-sans leading-relaxed transition-all resize-y'
              />
            </div>

            {/* Quick Template Helper Buttons */}
            <div className='flex flex-wrap items-center gap-2 mt-2'>
              <span className='text-[11px] font-semibold text-gray-400'>
                Quick Insert:
              </span>
              <button
                type='button'
                onClick={() =>
                  appendTemplateSection(
                    'Admission Eligibility & Age Criteria',
                    '- Minimum age: \n- Required documents: Birth certificate, TC, Previous report card, Aadhaar.\n- Admission deadline: '
                  )
                }
                className='px-2.5 py-1 text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all'
              >
                + Eligibility & Documents
              </button>
              <button
                type='button'
                onClick={() =>
                  appendTemplateSection(
                    'Curriculum & Key Subjects',
                    '- Core subjects offered: \n- Practical/Lab sessions: \n- Examination & assessment format: '
                  )
                }
                className='px-2.5 py-1 text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all'
              >
                + Curriculum & Subjects
              </button>
              <button
                type='button'
                onClick={() =>
                  appendTemplateSection(
                    'School Timings & Transport',
                    '- Daily timings: 8:15 AM to 3:30 PM (Mon-Fri).\n- Transport routes: Air-conditioned buses covering OMR, Medavakkam, Sholinganallur, and Tambaram.'
                  )
                }
                className='px-2.5 py-1 text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all'
              >
                + Timings & Transport
              </button>
            </div>
          </div>

          {/* Custom Instructions / Special Directives */}
          <div>
            <label className='block text-xs font-semibold text-gray-700 mb-1.5'>
              Special Directives for Gemini (Optional)
            </label>
            <input
              type='text'
              value={currentAgent.custom_instructions || ''}
              onChange={(e) =>
                setCurrentAgent((prev) => ({
                  ...prev,
                  custom_instructions: e.target.value
                }))
              }
              placeholder='e.g., Always remind parents that admissions for 2026-27 are currently open with early registration discount.'
              className='w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all'
            />
          </div>

          {/* Save Agent Button */}
          <div className='flex items-center justify-end pt-4 border-t border-gray-100'>
            <button
              type='button'
              onClick={handleSaveAgent}
              disabled={isSavingAgent}
              className='inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all disabled:opacity-50'
            >
              {isSavingAgent ? (
                <RotateCw className='w-4 h-4 animate-spin' />
              ) : (
                <Save className='w-4 h-4' />
              )}
              Save {selectedGrade} Agent
            </button>
          </div>
        </div>
      </div>

      {/* 3. In-Admin Interactive Agent Tester */}
      <div className='bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden'>
        <div className='p-6 bg-gradient-to-r from-emerald-50/40 via-teal-50/20 to-blue-50/30 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div>
            <h3 className='text-lg font-bold text-gray-900 flex items-center gap-2'>
              <MessageSquare className='w-5 h-5 text-emerald-600' />
              <span>Interactive Agent Tester</span>
            </h3>
            <p className='text-xs text-gray-500'>
              Test how the AI answers queries for{' '}
              <strong className='text-gray-800'>{selectedGrade}</strong> based on
              your configured knowledge text and tone.
            </p>
          </div>

          <span className='text-xs font-medium px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-700 shadow-2xs'>
            Active Tone: <strong>{currentAgent.tone}</strong>
          </span>
        </div>

        <div className='p-6 space-y-4'>
          {/* Quick test prompt suggestions */}
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-xs text-gray-400 font-medium'>
              Sample queries:
            </span>
            <button
              type='button'
              onClick={() =>
                setTestQuestion(`What are the key highlights of ${selectedGrade}?`)
              }
              className='text-xs text-blue-600 hover:text-blue-800 bg-blue-50/60 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg transition-colors'
            >
              &quot;What are the key highlights?&quot;
            </button>
            <button
              type='button'
              onClick={() =>
                setTestQuestion('What are the school timings and transport facilities?')
              }
              className='text-xs text-blue-600 hover:text-blue-800 bg-blue-50/60 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg transition-colors'
            >
              &quot;School timings & transport?&quot;
            </button>
            <button
              type='button'
              onClick={() =>
                setTestQuestion('How can we apply for admission and what documents are required?')
              }
              className='text-xs text-blue-600 hover:text-blue-800 bg-blue-50/60 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg transition-colors'
            >
              &quot;Admission process & documents?&quot;
            </button>
          </div>

          {/* Test Input */}
          <div className='flex gap-2'>
            <input
              type='text'
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTestAgent();
                }
              }}
              placeholder={`Ask a question as a parent interested in ${selectedGrade}...`}
              className='flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all'
            />
            <button
              type='button'
              onClick={handleTestAgent}
              disabled={isTestingAgent}
              className='inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-50 shrink-0'
            >
              {isTestingAgent ? (
                <RotateCw className='w-4 h-4 animate-spin' />
              ) : (
                <Send className='w-4 h-4' />
              )}
              Test Ask AI
            </button>
          </div>

          {/* Test Response Box */}
          {testResponse && (
            <div className='p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3 animate-fade-in'>
              <div className='flex items-center justify-between text-xs text-gray-500 border-b border-gray-200/60 pb-2'>
                <div className='flex items-center gap-2'>
                  <Bot className='w-4 h-4 text-emerald-600' />
                  <span className='font-bold text-gray-800'>
                    {testResponse.agentName}
                  </span>
                  <span className='px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700'>
                    {testResponse.studentGrade}
                  </span>
                </div>
                <span className='text-[10px] text-gray-400'>
                  Grounded with Gemini
                </span>
              </div>

              <div className='text-sm text-gray-800 leading-relaxed whitespace-pre-line'>
                {testResponse.reply
                  .replace(/\n\ntransfer-button/g, '')
                  .replace(/transfer-button/g, '')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
