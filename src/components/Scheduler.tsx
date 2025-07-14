import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  CalendarIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  PlayIcon,
  PauseIcon,
  SettingsIcon,
  GlobeIcon,
  BrainIcon,
  CameraIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  SaveIcon,
  XIcon
} from 'lucide-react';

interface ScheduleConfig {
  id: string;
  name: string;
  urls: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  timezone: string;
  enabled: boolean;
  crawlerConfig: {
    maxRequestsPerCrawl: number;
    enableAI: boolean;
    enableScreenshots: boolean;
    maxConcurrency: number;
  };
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'error' | 'running';
  createdAt: string;
  updatedAt: string;
}

export const Scheduler: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating/editing schedules
  const [formData, setFormData] = useState({
    name: '',
    urls: [''],
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '09:00',
    dayOfWeek: 1,
    dayOfMonth: 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    enabled: true,
    crawlerConfig: {
      maxRequestsPerCrawl: 50,
      enableAI: true,
      enableScreenshots: true,
      maxConcurrency: 5
    }
  });

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Australia/Sydney'
  ];

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Load schedules from backend
  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch('/api/schedules');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = () => {
    setIsCreating(true);
    setEditingSchedule(null);
    setFormData({
      name: '',
      urls: [''],
      frequency: 'daily',
      time: '09:00',
      dayOfWeek: 1,
      dayOfMonth: 1,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      enabled: true,
      crawlerConfig: {
        maxRequestsPerCrawl: 50,
        enableAI: true,
        enableScreenshots: true,
        maxConcurrency: 5
      }
    });
  };

  const handleEditSchedule = (schedule: ScheduleConfig) => {
    setEditingSchedule(schedule);
    setIsCreating(true);
    setFormData({
      name: schedule.name,
      urls: schedule.urls,
      frequency: schedule.frequency,
      time: schedule.time,
      dayOfWeek: schedule.dayOfWeek || 1,
      dayOfMonth: schedule.dayOfMonth || 1,
      timezone: schedule.timezone,
      enabled: schedule.enabled,
      crawlerConfig: schedule.crawlerConfig
    });
  };

  const handleSaveSchedule = async () => {
    try {
      setLoading(true);
      
      const scheduleData = {
        ...formData,
        id: editingSchedule?.id || Date.now().toString(),
        status: 'active' as const,
        createdAt: editingSchedule?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // TODO: Replace with actual API call
      const response = await fetch('/api/schedules', {
        method: editingSchedule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });

      if (response.ok) {
        await loadSchedules();
        setIsCreating(false);
        setEditingSchedule(null);
      }
    } catch (error) {
      console.error('Failed to save schedule:', error);
      setError('Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadSchedules();
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      setError('Failed to delete schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSchedule = async (id: string, enabled: boolean) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`/api/schedules/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        await loadSchedules();
      }
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      setError('Failed to toggle schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`/api/schedules/${id}/run`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadSchedules();
      }
    } catch (error) {
      console.error('Failed to run schedule:', error);
      setError('Failed to run schedule');
    } finally {
      setLoading(false);
    }
  };

  const addUrlField = () => {
    setFormData(prev => ({
      ...prev,
      urls: [...prev.urls, '']
    }));
  };

  const removeUrlField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      urls: prev.urls.filter((_, i) => i !== index)
    }));
  };

  const updateUrlField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      urls: prev.urls.map((url, i) => i === index ? value : url)
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon size={16} className="text-green-500" />;
      case 'paused':
        return <PauseIcon size={16} className="text-yellow-500" />;
      case 'error':
        return <XCircleIcon size={16} className="text-red-500" />;
      case 'running':
        return <PlayIcon size={16} className="text-blue-500" />;
      default:
        return <AlertCircleIcon size={16} className="text-gray-500" />;
    }
  };

  const getFrequencyDisplay = (schedule: ScheduleConfig) => {
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${schedule.time}`;
      case 'weekly':
        return `Weekly on ${daysOfWeek[schedule.dayOfWeek || 1]} at ${schedule.time}`;
      case 'monthly':
        return `Monthly on day ${schedule.dayOfMonth} at ${schedule.time}`;
      default:
        return 'Unknown frequency';
    }
  };

  if (isCreating) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-white">
                {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
              </h1>
              <div className="space-x-4">
                <button
                  onClick={handleSaveSchedule}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl text-white font-medium flex items-center space-x-2 transition-colors"
                >
                  <SaveIcon size={20} />
                  <span>{loading ? 'Saving...' : 'Save Schedule'}</span>
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-xl text-white font-medium flex items-center space-x-2 transition-colors"
                >
                  <XIcon size={20} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Settings */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Schedule Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Daily Security News Crawl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URLs to Crawl
                  </label>
                  <div className="space-y-2">
                    {formData.urls.map((url, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => updateUrlField(index, e.target.value)}
                          className="flex-1 px-4 py-3 bg-gray-700/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://example.com"
                        />
                        {formData.urls.length > 1 && (
                          <button
                            onClick={() => removeUrlField(index)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <TrashIcon size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addUrlField}
                      className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <PlusIcon size={16} />
                      <span>Add URL</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {formData.frequency === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Day of Week
                      </label>
                      <select
                        value={formData.dayOfWeek}
                        onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {daysOfWeek.map((day, index) => (
                          <option key={index} value={index}>{day}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.frequency === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Day of Month
                      </label>
                      <select
                        value={formData.dayOfMonth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Crawler Configuration */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <SettingsIcon size={20} />
                  <span>Crawler Configuration</span>
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Requests Per Crawl
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.crawlerConfig.maxRequestsPerCrawl}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      crawlerConfig: { ...prev.crawlerConfig, maxRequestsPerCrawl: parseInt(e.target.value) }
                    }))}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Concurrency
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.crawlerConfig.maxConcurrency}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      crawlerConfig: { ...prev.crawlerConfig, maxConcurrency: parseInt(e.target.value) }
                    }))}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BrainIcon size={20} className="text-blue-400" />
                      <span className="text-white">Enable AI Processing</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.crawlerConfig.enableAI}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        crawlerConfig: { ...prev.crawlerConfig, enableAI: e.target.checked }
                      }))}
                      className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CameraIcon size={20} className="text-green-400" />
                      <span className="text-white">Enable Screenshots</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.crawlerConfig.enableScreenshots}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        crawlerConfig: { ...prev.crawlerConfig, enableScreenshots: e.target.checked }
                      }))}
                      className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon size={20} className="text-green-400" />
                      <span className="text-white">Enable Schedule</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Crawl Scheduler</h1>
              <p className="text-gray-400">Manage automated crawling schedules</p>
            </div>
            <button
              onClick={handleCreateSchedule}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium flex items-center space-x-2 transition-colors"
            >
              <PlusIcon size={20} />
              <span>Create Schedule</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-8">
            <div className="flex items-center space-x-2 text-red-300">
              <XCircleIcon size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Schedules List */}
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
              <ClockIcon size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No schedules yet</h3>
              <p className="text-gray-400">Create your first crawling schedule to get started</p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(schedule.status)}
                      <h3 className="text-xl font-semibold text-white">{schedule.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <CalendarIcon size={16} />
                      <span className="text-sm">{getFrequencyDisplay(schedule)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRunNow(schedule.id)}
                      disabled={loading || schedule.status === 'running'}
                      className="p-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-300 disabled:opacity-50 transition-colors"
                      title="Run Now"
                    >
                      <PlayIcon size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleSchedule(schedule.id, !schedule.enabled)}
                      disabled={loading}
                      className={`p-2 rounded-lg border transition-colors ${
                        schedule.enabled
                          ? 'bg-yellow-600/20 hover:bg-yellow-600/30 border-yellow-500/30 text-yellow-300'
                          : 'bg-gray-600/20 hover:bg-gray-600/30 border-gray-500/30 text-gray-300'
                      }`}
                      title={schedule.enabled ? 'Pause' : 'Resume'}
                    >
                      {schedule.enabled ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
                    </button>
                    <button
                      onClick={() => handleEditSchedule(schedule)}
                      className="p-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 transition-colors"
                      title="Edit"
                    >
                      <EditIcon size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      disabled={loading}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 disabled:opacity-50 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">URLs</div>
                    <div className="text-white">
                      {schedule.urls.length} URL{schedule.urls.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Last Run</div>
                    <div className="text-white">
                      {schedule.lastRun ? new Date(schedule.lastRun).toLocaleString() : 'Never'}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Next Run</div>
                    <div className="text-white">
                      {schedule.nextRun ? new Date(schedule.nextRun).toLocaleString() : 'Not scheduled'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {schedule.urls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-700/50 rounded-lg px-3 py-1">
                      <GlobeIcon size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-300">{new URL(url).hostname}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 