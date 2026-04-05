import { useEffect, useState, useCallback } from 'react';
import { useExperimentStore } from './store/useExperimentStore';
import { useAuthStore } from './store/useAuthStore';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './components/Dashboard/Dashboard';
import Calendar from './components/Calendar/Calendar';
import ExperimentModal from './components/Experiment/ExperimentModal';
import ExperimentDetail from './components/Experiment/ExperimentDetail';
import LoginPage from './components/Auth/LoginPage';

export default function App() {
  const { currentView, selectedExperimentId, loadUserExperiments, loading: dataLoading } = useExperimentStore();
  const { isAllowed, loading: authLoading, initialize, user } = useAuthStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [createDates, setCreateDates] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  useEffect(() => {
    if (isAllowed && user) {
      loadUserExperiments(user.uid);
    }
  }, [isAllowed, user, loadUserExperiments]);

  const handleCreateExperiment = useCallback((startDate: string, endDate: string) => {
    setCreateDates({ start: startDate, end: endDate });
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setCreateDates(null);
  }, []);

  if (authLoading || dataLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAllowed) {
    return <LoginPage />;
  }

  return (
    <AppLayout>
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'calendar' && (
        <Calendar onCreateExperiment={handleCreateExperiment} />
      )}

      <ExperimentModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        initialStartDate={createDates?.start}
        initialEndDate={createDates?.end}
      />

      {selectedExperimentId && <ExperimentDetail />}
    </AppLayout>
  );
}
