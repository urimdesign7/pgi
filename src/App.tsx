import { useEffect, useState } from 'react';
import { AboutSection, type AboutTab } from './components/AboutSection';
import { AdminPage, type AdminSectionTab } from './components/AdminPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { MinistrySection } from './components/MinistrySection';
import { LiveWorshipModal, NoticeDetailModal } from './components/Modals';
import { Navbar } from './components/Navbar';
import { NoticesAndContactSection } from './components/NoticesAndContactSection';
import { TorahSection } from './components/TorahSection';
import { TrainingSection } from './components/TrainingSection';
import type { NoticeItem } from './data/pgiData';

function parseAdminHash(hash: string): { isAdmin: boolean; tab: AdminSectionTab } {
  if (hash === '#admin-history') {
    return { isAdmin: true, tab: 'history' };
  }
  if (hash === '#admin-participants') {
    return { isAdmin: true, tab: 'participants' };
  }
  if (hash === '#admin-inquiries') {
    return { isAdmin: true, tab: 'inquiries' };
  }
  if (hash === '#admin') {
    return { isAdmin: true, tab: 'notices' };
  }
  return { isAdmin: false, tab: 'notices' };
}

function getAdminHash(tab: AdminSectionTab): string {
  if (tab === 'history') return 'admin-history';
  if (tab === 'participants') return 'admin-participants';
  if (tab === 'inquiries') return 'admin-inquiries';
  return 'admin';
}

export default function App() {
  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [selectedNoticeState, setSelectedNoticeState] = useState<{
    notice: NoticeItem;
    initialSlideIndex?: number;
  } | null>(null);
  const [preselectedTopic, setPreselectedTopic] = useState<string>('');
  const [requestedAboutTab, setRequestedAboutTab] = useState<{
    tab: AboutTab;
    key: number;
  } | null>(null);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);
  const [adminRoute, setAdminRoute] = useState<{ isAdmin: boolean; tab: AdminSectionTab }>(() => {
    if (typeof window === 'undefined') return { isAdmin: false, tab: 'notices' };
    return parseAdminHash(window.location.hash);
  });

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setAdminRoute(parseAdminHash(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openAdminPage = (tab: AdminSectionTab = 'notices') => {
    window.location.hash = getAdminHash(tab);
    setAdminRoute({ isAdmin: true, tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeAdminTab = (tab: AdminSectionTab) => {
    window.location.hash = getAdminHash(tab);
    setAdminRoute({ isAdmin: true, tab });
  };

  const backToSite = () => {
    if (
      window.location.hash === '#admin' ||
      window.location.hash === '#admin-history' ||
      window.location.hash === '#admin-participants' ||
      window.location.hash === '#admin-inquiries'
    ) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setAdminRoute({ isAdmin: false, tab: 'notices' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProgramForInquiry = (programTitle: string) => {
    setPreselectedTopic(programTitle);
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenDirections = () => {
    setRequestedAboutTab({ tab: 'directions', key: Date.now() });
    const aboutEl = document.getElementById('about');
    if (aboutEl) {
      aboutEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ErrorBoundary>
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      {adminRoute.isAdmin ? (
        <AdminPage
          initialTab={adminRoute.tab}
          onChangeTab={handleChangeAdminTab}
          onBackToSite={backToSite}
        />
      ) : (
        <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
          <Navbar onOpenAdminPage={() => openAdminPage('notices')} />

          <main className="flex-1">
            <HeroSection onOpenLiveModal={() => setLiveModalOpen(true)} />
            <AboutSection requestedTab={requestedAboutTab} />
            <MinistrySection onOpenLiveModal={() => setLiveModalOpen(true)} />
            <TrainingSection onSelectProgramForInquiry={handleSelectProgramForInquiry} />
            <TorahSection />
            <NoticesAndContactSection
              onSelectNotice={(notice, initialSlideIndex) =>
                setSelectedNoticeState({ notice, initialSlideIndex })
              }
              onOpenDirections={handleOpenDirections}
              preselectedTopic={preselectedTopic}
            />
          </main>

          <Footer onOpenAdminPage={() => openAdminPage('notices')} />

          <LiveWorshipModal
            isOpen={liveModalOpen}
            onClose={() => setLiveModalOpen(false)}
          />
          <NoticeDetailModal
            notice={selectedNoticeState?.notice ?? null}
            initialSlideIndex={selectedNoticeState?.initialSlideIndex ?? 0}
            onClose={() => setSelectedNoticeState(null)}
          />
        </div>
      )}
    </ErrorBoundary>
  );
}
