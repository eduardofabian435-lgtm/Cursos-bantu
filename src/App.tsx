import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import { 
  BookOpen, 
  GraduationCap, 
  User, 
  LogOut, 
  LayoutDashboard, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Menu,
  X,
  Plus,
  CheckCircle2,
  Sparkles,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Home,
  Phone,
  Users,
  Crown,
  Download,
  MapPin,
  ShieldCheck,
  FileText,
  PiggyBank,
  Activity
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { signInWithGoogle, logout } from './lib/firebase';
import { 
  getCourses, 
  getEnrollmentsByStudent, 
  getAllEnrollments,
  getApprovedEnrollmentsCount,
  getTotalEnrollmentsCount,
  updateEnrollmentStatus,
  updateCourse,
  deleteCourse,
  deleteEnrollment,
  acceptTerms,
  logUserAccess,
  createAuditLog,
  getStudentScholarships,
  getScholarshipConfig,
  Course, 
  Enrollment,
  UserProfile,
  StudentScholarship,
  ScholarshipConfig,
  AuditLog
} from './services/db';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import { EnrollmentForm } from './components/EnrollmentForm';
import { CourseForm } from './components/CourseForm';
import { PrivacyModal } from './components/PrivacyModal';
import { UserManualModal } from './components/UserManualModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { TeacherPanelModal } from './components/TeacherPanelModal';

// --- Components ---

const Navbar = ({ 
  onOpenTeacherPanel, 
  onOpenAdminPanel 
}: { 
  onOpenTeacherPanel: () => void;
  onOpenAdminPanel: (tab?: 'users' | 'logs' | 'scholarships') => void;
}) => {
  const { user, profile, isAdmin, isTeacher } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <nav className="bg-white border-b border-slate-200 px-6 sm:px-10 py-5 flex justify-between items-center shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">CB</div>
        <div>
          <h1 className="text-lg font-black tracking-tighter leading-none text-slate-900 uppercase">Cursos Bantu</h1>
          <p className="label-caps mt-1">Cursos & Matrículas</p>
        </div>
      </div>

      <div className="hidden md:flex gap-8 items-center">
        <div className="flex gap-6 text-sm font-medium text-slate-600">
          <a 
            href="#courses" 
            onClick={(e) => scrollToSection(e, 'courses')}
            className="hover:text-indigo-600 transition-colors"
          >
            Cursos Disponíveis
          </a>
          {(isAdmin || isTeacher) && (
            <button 
              onClick={onOpenTeacherPanel}
              className="text-slate-600 font-bold hover:text-indigo-600 transition-all uppercase tracking-widest text-[11px]"
            >
              Aba do Professor
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => onOpenAdminPanel('users')}
              className="text-indigo-600 font-bold border-b-2 border-indigo-600 pb-1 hover:text-indigo-800 transition-colors"
            >
              Painel Admin
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 pl-8 border-l border-slate-200">
          {user ? (
            <>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">{profile?.name}</p>
                <p className="text-[10px] text-green-600 font-medium uppercase tracking-widest">Sistema Online</p>
              </div>
              <button 
                onClick={logout}
                className="w-10 h-10 bg-slate-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all overflow-hidden"
              >
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
              </button>
            </>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest"
            >
              Entrar
            </button>
          )}
        </div>
      </div>

      <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X className="text-slate-900" /> : <Menu className="text-slate-900" />}
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 md:hidden bg-white border-b border-slate-200 p-6 space-y-4 shadow-xl z-50"
          >
            <a 
              href="#courses" 
              onClick={(e) => scrollToSection(e, 'courses')}
              className="block text-slate-600 font-bold uppercase tracking-widest text-xs"
            >
              Cursos Disponíveis
            </a>
            {(isAdmin || isTeacher) && (
              <button 
                onClick={() => {
                  onOpenTeacherPanel();
                  setIsOpen(false);
                }}
                className="block w-full text-left font-black text-indigo-600 uppercase tracking-widest text-xs"
              >
                Espaço do Professor
              </button>
            )}
            {isAdmin && (
              <button 
                onClick={() => {
                  onOpenAdminPanel('users');
                  setIsOpen(false);
                }}
                className="block text-indigo-600 font-bold uppercase tracking-widest text-xs text-left"
              >
                Painel de Gestão
              </button>
            )}
            {!user && (
              <button onClick={signInWithGoogle} className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold uppercase tracking-widest text-xs">
                Entrar
              </button>
            )}
            {user && (
              <button onClick={logout} className="w-full text-red-500 font-bold uppercase tracking-widest text-xs text-left">
                Sair
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const CourseCard = ({ 
  course, 
  onEnroll, 
  onEdit,
  onStatusChange, 
  onDelete, 
  isAdmin 
}: { 
  course: Course, 
  onEnroll?: () => void, 
  onEdit?: () => void,
  onStatusChange?: (id: string, status: 'open' | 'closed') => void | Promise<void>,
  onDelete?: (id: string) => void | Promise<void>,
  isAdmin?: boolean,
  key?: any
}) => {
  const isClosed = course.status === 'closed';
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isRemoving) return;
    
    // We set removing immediately, but the parent should remove us from DOM anyway
    setIsRemoving(true);
    
    // Safety timeout to prevent local UI lock if re-render is delayed
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 30000)
    );

    try {
      if (!onDelete) {
        setIsRemoving(false);
        setShowConfirm(false);
        return;
      }
      
      await Promise.race([
        onDelete(course.id),
        timeout
      ]);
    } catch (err: any) {
      console.warn("Delete action in CourseCard:", err.message);
    } finally {
      // Re-enable if still mounted (meaning delete failed or parent didn't remove us)
      setIsRemoving(false);
      setShowConfirm(false);
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200 group relative ${isClosed ? 'opacity-70' : ''} ${isRemoving ? 'opacity-50 grayscale' : ''}`}
    >
      {isClosed && !showConfirm && (
        <div className="absolute top-0 left-0 right-0 bg-slate-900/10 backdrop-blur-[2px] h-full z-10 pointer-events-none flex items-center justify-center">
          <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-xl">Desativado</span>
        </div>
      )}

      {showConfirm && (
        <div className="absolute inset-0 z-30 bg-rose-600/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <Trash2 className="w-8 h-8 text-white mb-3 animate-bounce" />
          <p className="text-white font-black uppercase tracking-tighter text-sm mb-4">Excluir este curso?</p>
          <div className="flex gap-2 w-full">
            <button 
              onClick={handleConfirmDelete}
              disabled={isRemoving}
              className="flex-1 bg-white text-rose-600 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 transition-colors"
            >
              {isRemoving ? '...' : 'SIM, EXCLUIR'}
            </button>
            <button 
              onClick={handleCancelDelete}
              disabled={isRemoving}
              className="flex-1 bg-rose-800 text-white py-2 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-rose-900 transition-colors"
            >
              NÃO
            </button>
          </div>
        </div>
      )}

      <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden flex items-center justify-center">
        {course.imageUrl ? (
          <img 
            src={course.imageUrl}
            alt={course.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <span className="bg-white/90 backdrop-blur-sm text-slate-900 text-[9px] uppercase tracking-widest font-black px-2.5 py-1 rounded border border-slate-200/50">
              {course.category}
            </span>
            <span className="bg-indigo-600 text-white text-[9px] uppercase tracking-widest font-black px-2.5 py-1 rounded shadow-sm">
              Polo {course.polo}
            </span>
          </div>
          {isAdmin && (
            <span className={`text-[9px] uppercase tracking-widest font-black px-2.5 py-1 rounded border self-start ${isClosed ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              {isClosed ? 'Inativo' : 'Ativo'}
            </span>
          )}
        </div>

        {isAdmin && !showConfirm && (
          <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-20">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit?.();
              }}
              className="p-2 bg-white/95 backdrop-blur shadow-sm rounded-lg text-slate-600 hover:text-indigo-600 transition-all border border-slate-200/50"
              title="Editar Curso"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStatusChange?.(course.id, isClosed ? 'open' : 'closed');
              }}
              className="p-2 bg-white/95 backdrop-blur shadow-sm rounded-lg text-slate-600 hover:text-indigo-600 transition-all border border-slate-200/50"
              title={isClosed ? "Ativar Curso" : "Desativar Curso"}
            >
              {isClosed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            
            <button 
              onClick={handleDeleteClick}
              className="p-2 bg-white/95 backdrop-blur shadow-sm rounded-lg text-slate-400 hover:text-rose-500 transition-all border border-slate-200/50"
              title="Excluir Curso"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{course.title}</h3>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-indigo-500" /> Professor: <span className="text-slate-900">{course.instructor || 'A definir'}</span>
        </p>
        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-6">
          {course.description}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-widest">{course.duration || 'Consulte'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <User className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-widest">{course.capacity || 0} Vagas</span>
            </div>
          </div>
          {onEnroll && (
            <button 
              onClick={onEnroll}
              disabled={isClosed}
              className={`px-4 py-2 rounded text-[9px] font-black uppercase tracking-widest transition-all shadow-md ${isClosed ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
            >
              Matricular
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const StatusBadge = ({ status }: { status: Enrollment['status'] }) => {
  const configs = {
    pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, text: 'EM ANÁLISE' },
    approved: { color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle, text: 'APROVADA' },
    rejected: { color: 'bg-rose-100 text-rose-800 border-rose-300', icon: AlertCircle, text: 'RECUSADA' },
  };
  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black border-2 tracking-[0.1em] shadow-sm ${config.color}`}>
      <Icon className="w-3.5 h-3.5" strokeWidth={3} />
      {config.text}
    </span>
  );
};

const AppContent = () => {
  const { user, profile, loading: authLoading, isAdmin, isMasterAdmin } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [scholarships, setScholarships] = useState<StudentScholarship[]>([]);
  const [scholarshipConfig, setScholarshipConfig] = useState<ScholarshipConfig | null>(null);
  const [totalApprovedCount, setTotalApprovedCount] = useState(0);

  const fetchScholarshipData = async () => {
    const config = await getScholarshipConfig();
    setScholarshipConfig(config);
  };
  const [totalEnrollmentsCount, setTotalEnrollmentsCount] = useState(0);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [isEnrollmentSuccess, setIsEnrollmentSuccess] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [manualPrivacyShow, setManualPrivacyShow] = useState(false);
  const [showUserManual, setShowUserManual] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPanelTab, setAdminPanelTab] = useState<'users' | 'logs' | 'scholarships'>('users');
  const [showTeacherPanel, setShowTeacherPanel] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [selectedPolo, setSelectedPolo] = useState<'Salvador' | 'Ilha' | 'Todos'>('Todos');

  useEffect(() => {
    if (authLoading || !isAdmin || !user) return;
    
    const locallyAccepted = localStorage.getItem(`accepted_terms_${user.uid}`);
    if (!profile?.acceptedTermsAt && !locallyAccepted) {
      setShowPrivacyNotice(true);
    }
  }, [authLoading, isAdmin, profile?.acceptedTermsAt, user]);

  useEffect(() => {
    fetchCourses();
    fetchStats();
    fetchScholarshipData();
  }, []);

  const fetchStats = async () => {
    const [approved, total] = await Promise.all([
      getApprovedEnrollmentsCount(),
      getTotalEnrollmentsCount()
    ]);
    setTotalApprovedCount(approved);
    setTotalEnrollmentsCount(total);
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchAllEnrollments();
    }
  }, [user, isAdmin]);

  const [viewingEnrollment, setViewingEnrollment] = useState<Enrollment | null>(null);
  const [viewingClass, setViewingClass] = useState<Course | null>(null);
  const [migratingStudentData, setMigratingStudentData] = useState<Enrollment['studentData'] | null>(null);
  const [isPreviewingPrint, setIsPreviewingPrint] = useState(false);
  const [isPreviewingFullEnrollmentPrint, setIsPreviewingFullEnrollmentPrint] = useState(false);
  const [isPreviewingClassPrint, setIsPreviewingClassPrint] = useState(false);
  const [isPreviewingFullDataPrint, setIsPreviewingFullDataPrint] = useState(false);

  const formatSaneamento = (val: string | undefined) => {
    if (!val) return 'N/A';
    const upper = val.toUpperCase();
    if (upper === 'SIM' || upper === 'REGULARIZADO') return 'Regularizado';
    if (upper === 'NÃO' || upper === 'IRREGULAR' || upper === 'NAO') return 'Irregular';
    return val;
  };

  const isIrregular = (val: string | undefined) => {
    if (!val) return false;
    const upper = val.toUpperCase();
    return upper === 'NÃO' || upper === 'IRREGULAR' || upper === 'NAO';
  };

  const filteredCourses = selectedPolo === 'Todos' 
    ? courses 
    : courses.filter(c => c.polo === selectedPolo);

  const filteredEnrollments = selectedPolo === 'Todos'
    ? allEnrollments
    : allEnrollments.filter(e => e.polo === selectedPolo);

  // Group enrollments by student (using CPF as key)
  const groupedEnrollments = filteredEnrollments.reduce((acc, enrollment) => {
    const key = enrollment.studentData.cpf || enrollment.studentData.fullName;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(enrollment);
    return acc;
  }, {} as Record<string, Enrollment[]>);

  const studentList: Enrollment[][] = Object.values(groupedEnrollments);

  const totalCapacity = filteredCourses.reduce((sum, c) => {
    const cap = parseInt(String(c.capacity)) || 0;
    return sum + cap;
  }, 0);
  const occupancyPercentage = totalCapacity > 0 ? Math.min(100, Math.round((totalApprovedCount / totalCapacity) * 100)) : 0;

  const handleViewEnrollment = (enrollment: Enrollment) => {
    setViewingEnrollment(enrollment);
  };

  const handleViewClass = (course: Course) => {
    setViewingClass(course);
  };

  const fetchCourses = async () => {
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchUserEnrollments = async () => {
    // Disabled for presential-only model
  };

  const fetchAllEnrollments = async () => {
    // Mesma lógica do fetchCourses
    try {
      const [enrs, schols] = await Promise.all([
        getAllEnrollments(),
        getStudentScholarships()
      ]);
      setAllEnrollments(enrs);
      setScholarships(schols);
    } catch (error: any) {
      console.error("Error fetching enrollments:", error);
    }
  };

  const handleEditEnrollment = (enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);
  };

  const handleEditSuccess = () => {
    setEditingEnrollment(null);
    fetchAllEnrollments();
    fetchStats();
    setIsEnrollmentSuccess(true);
    setTimeout(() => setIsEnrollmentSuccess(false), 5000);
  };

  const handleEnrollmentSuccess = () => {
    setActiveCourse(null);
    setIsEnrollmentSuccess(true);
    
    fetchUserEnrollments();
    fetchAllEnrollments();
    fetchStats();
    setTimeout(() => setIsEnrollmentSuccess(false), 5000);
  };

  const handleStatusUpdate = async (id: string, status: Enrollment['status']) => {
    // Optimistic Update
    setAllEnrollments(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    if (viewingEnrollment?.id === id) {
      setViewingEnrollment(prev => prev ? { ...prev, status } : null);
    }

    try {
      await updateEnrollmentStatus(id, status);
      fetchStats();
    } catch (error: any) {
      console.error("Status update error:", error);
      // Revert optimism on error
      fetchAllEnrollments();
      alert("Erro ao atualizar status. O sistema pode estar com limite de uso atingido.");
    }
  };

  const handleCourseStatusChange = async (id: string, status: 'open' | 'closed') => {
    await updateCourse(id, { status });
    
    if (user) {
      createAuditLog({
        userId: user.uid,
        userName: user.displayName || user.email || 'Admin',
        action: 'COURSE_STATUS_UPDATE',
        resourceId: id,
        resourceType: 'course',
        details: `Status do curso alterado para: ${status.toUpperCase()}`
      });
    }

    fetchCourses();
  };

  const handleCourseDelete = async (id: string) => {
    const course = courses.find(c => c.id === id);
    if (!course) return;

    // --- OPTIMISTIC DELETE WITH REBALANCING ---
    const previousCourses = [...courses];
    setCourses(prev => prev.filter(c => c.id !== id));

    try {
      console.log(`Iniciando exclusão do curso: ${id}`);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 30000)
      );

      await Promise.race([
        deleteCourse(id),
        timeoutPromise
      ]);
      await Promise.all([fetchStats(), fetchCourses()]);
    } catch (error: any) {
      console.error("Error in handleCourseDelete:", error);
      
      // If it's a timeout, we ASSUME it will eventually succeed on the server
      // and we DO NOT revert the UI state, allowing the optimistic deletion to stay.
      if (error.message && error.message.includes("Timeout")) {
        console.warn("Delete pending on server due to slowness. Keeping optimistic UI state.");
        return;
      }

      // Revert ONLY on hard confirmed errors (like permission denied or not found)
      setCourses(previousCourses);
      
      let errorMsg = "Não foi possível confirmar a exclusão. O curso foi restaurado para segurança.";
      if (error.message?.includes('Quota exceeded') || error.message?.includes('resource-exhausted')) {
        errorMsg = "Limite de uso do Firebase atingido. O curso não pôde ser excluído no servidor.";
      }
      
      alert(errorMsg);
    }
  };

  const handleEnrollmentDelete = async (id: string) => {
    const enrollment = allEnrollments.find(e => e.id === id);
    if (!enrollment) return;

    if (!window.confirm(`Deseja realmente excluir permanentemente a matrícula de ${enrollment.studentData.fullName}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    // --- OPTIMISTIC DELETE WITH REBALANCING ---
    const previousEnrollments = [...allEnrollments];
    setAllEnrollments(prev => prev.filter(e => e.id !== id));

    try {
      console.log(`Iniciando exclusão da matrícula: ${id}`);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 30000)
      );

      await Promise.race([
        deleteEnrollment(id),
        timeoutPromise
      ]);
      await fetchStats();
    } catch (error: any) {
      console.error("Error in handleEnrollmentDelete:", error);
      
      if (error.message && error.message.includes("Timeout")) {
        console.warn("Enrollment delete pending on server. Keeping optimistic UI state.");
        return;
      }

      // Revert on actual hard error (not timeout)
      setAllEnrollments(previousEnrollments);
      
      let errorMsg = "Não foi possível confirmar a exclusão. A matrícula foi restaurada.";
      if (error.message?.includes('Quota exceeded') || error.message?.includes('resource-exhausted')) {
        errorMsg = "Limite de uso atingido. A exclusão falhou no servidor.";
      }
      
      alert(errorMsg);
    }
  };

  const handleAcceptTerms = async (metadata: { ip: string; version: string }) => {
    if (user) {
      // Salva localmente primeiro para esconder o modal imediatamente
      localStorage.setItem(`accepted_terms_${user.uid}`, 'true');
      
      try {
        await acceptTerms(user.uid, metadata);
      } catch (error) {
        console.warn("Aviso: Falha ao salvar no banco (Cota?), mas salvo localmente.");
      }
      
      setShowPrivacyNotice(false);
      setManualPrivacyShow(false);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Navbar 
        onOpenTeacherPanel={() => setShowTeacherPanel(true)} 
        onOpenAdminPanel={(tab) => {
          if (tab) setAdminPanelTab(tab);
          setShowAdminPanel(true);
        }}
      />

      <main className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        {/* Left Section: Info & Hero */}
        <section className="lg:w-1/3 bg-slate-100 border-r border-slate-200 p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-4xl sm:text-5xl font-light text-slate-900 leading-[1.1] mb-8">
              Painel de <br />
              <span className="font-black">Matrículas Presenciais.</span>
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-12 max-w-sm">
              Ferramenta interna para cadastro de novos alunos. 
              Realize a inscrição coletando os dados do jovem e do responsável no balcão.
            </p>

            <div className="grid grid-cols-1 gap-4 mb-12">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <p className="label-caps mb-1">Alunos Atendidos {selectedPolo === 'Todos' ? '' : `(${selectedPolo})`}</p>
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-slate-900">{studentList.length}</span>
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded tracking-widest uppercase">ÚNICOS</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <p className="label-caps mb-1">Matrículas Realizadas {selectedPolo === 'Todos' ? '' : `(${selectedPolo})`}</p>
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-slate-900">
                    {filteredEnrollments.length}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded tracking-widest uppercase">CONTRATOS</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <p className="label-caps mb-1">Cursos {selectedPolo === 'Todos' ? 'Totais' : selectedPolo}</p>
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-slate-900">{filteredCourses.length}</span>
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded tracking-widest uppercase">OFERTA</span>
                </div>
              </div>
              {isAdmin && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                  <p className="label-caps mb-1">Bolsistas Ativos</p>
                  <div className="flex justify-between items-end">
                    <span className="text-3xl font-black text-slate-900">{scholarships.filter(s => s.status === 'active').length}</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded tracking-widest uppercase">RECEBENDO</span>
                  </div>
                </div>
              )}
            </div>

            {user && (
              <div className="space-y-4">
                {scholarships.find(s => s.studentId === user.uid)?.status === 'active' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-200 relative overflow-hidden"
                  >
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                          <PiggyBank className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Minha Bolsa Ativa</span>
                      </div>
                      <p className="text-3xl font-black mb-1">R$ {scholarshipConfig?.monthlyValue || '---'}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Benefício Mensal Liberado</p>
                      
                      {scholarshipConfig?.benefits && scholarshipConfig.benefits.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                          {scholarshipConfig.benefits.map((b, i) => (
                            <span key={i} className="bg-white/10 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border border-white/5">
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>

          <div className="bg-indigo-900 p-8 rounded-2xl text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] opacity-60 mb-2 uppercase tracking-widest font-bold">Próximo Ciclo</p>
              <p className="text-2xl font-bold">Semestre 2026.1</p>
              <div className="mt-6 h-1.5 w-full bg-indigo-950 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${occupancyPercentage || 0}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]" 
                />
              </div>
            <p className="text-[10px] mt-3 opacity-50 font-bold tracking-widest uppercase">
                {courses.length > 0 ? `${occupancyPercentage || 0}% das turmas preenchidas` : 'Nenhuma turma cadastrada'}
              </p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          </div>
        </section>

        {/* Right Section: Content */}
        <section className="flex-1 p-8 sm:p-12 lg:p-16 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-24">
            
            {/* Courses View */}
            <div id="courses">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Cursos Disponíveis</h3>
                    <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {selectedPolo === 'Todos' ? 'Todos os Polos' : `Polo ${selectedPolo}`}
                    </div>
                  </div>
                  <p className="text-slate-500 font-medium text-sm">Selecione uma área para iniciar sua inscrição</p>
                </div>
                
                <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm self-start sm:self-center">
                  {['Todos', 'Salvador', 'Ilha'].map((polo) => (
                    <button
                      key={polo}
                      onClick={() => setSelectedPolo(polo as any)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedPolo === polo 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {polo}
                    </button>
                  ))}
                </div>

                {isAdmin && (
                  <button 
                    onClick={() => setShowCourseForm(true)}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-[10px] font-black tracking-widest uppercase hover:bg-slate-800 transition-all flex items-center gap-2 self-start sm:self-center"
                  >
                    <Plus className="w-3 h-3" /> Novo Curso
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {migratingStudentData && (
                  <div className="col-span-full bg-indigo-50 border-2 border-indigo-200 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-indigo-900 uppercase">Escolhendo novo curso para:</h4>
                        <p className="text-xl font-black text-indigo-600">{migratingStudentData.fullName}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setMigratingStudentData(null)}
                      className="px-6 py-2 bg-white text-slate-500 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Cancelar Migração
                    </button>
                  </div>
                )}
                {filteredCourses.length > 0 ? (
                  filteredCourses.map(course => (
                    <CourseCard 
                      key={course.id} 
                      course={course} 
                      onEnroll={isAdmin ? () => setActiveCourse(course) : undefined} 
                      onEdit={isAdmin ? () => setEditingCourse(course) : undefined}
                      onStatusChange={isAdmin ? handleCourseStatusChange : undefined}
                      onDelete={isAdmin ? handleCourseDelete : undefined}
                      isAdmin={isAdmin}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-20 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Plus className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Nenhum Curso Ativo</h4>
                    <p className="text-slate-500 text-sm max-w-xs mt-2 mb-8">Comece cadastrando os cursos da sua instituição para realizar as matrículas.</p>
                    {isAdmin && (
                      <button 
                        onClick={() => setShowCourseForm(true)}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                      >
                        Cadastrar Primeiro Curso
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* My Enrollments View Removed for Presencial Model */}

            {/* Ficha de Turmas Button (Admin Only) */}
            {isAdmin && (
              <div className="pb-12 border-b border-slate-200">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Ficha de Turmas</h3>
                    <p className="text-slate-500 font-medium text-sm">Visualize a listagem de alunos por polo: <span className="text-indigo-600 font-black">{selectedPolo}</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCourses.map(course => {
                    const approvedCount = allEnrollments.filter(e => e.courseId === course.id && e.status === 'approved').length;
                    const pendingCount = allEnrollments.filter(e => e.courseId === course.id && e.status === 'pending').length;
                    
                    return (
                      <button 
                        key={course.id}
                        onClick={() => handleViewClass(course)}
                        className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-md transition-all text-left group"
                      >
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-4">{course.title}</h4>
                        <div className="flex gap-4">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Aprovados</p>
                            <p className="text-lg font-black text-emerald-600">{approvedCount}</p>
                          </div>
                          <div className="w-px h-8 bg-slate-100 mt-2"></div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendentes</p>
                            <p className="text-lg font-black text-amber-500">{pendingCount}</p>
                          </div>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          Ver Listagem Completa <Plus className="w-3 h-3" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Admin Grid */}
            {isAdmin && (
              <div id="admin" className="pt-12">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Painel de Gestão</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setAdminPanelTab('scholarships');
                        setShowAdminPanel(true);
                      }}
                      className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                      <PiggyBank className="w-3.5 h-3.5" /> Configurar Bolsas
                    </button>
                    <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> {selectedPolo}
                    </span>
                    <button 
                      onClick={() => fetchAllEnrollments()}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Atualizar Dados"
                    >
                      <Sparkles className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {studentList.length > 0 ? (
                    <div className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans text-sm">
                          <thead className="bg-slate-50/50 border-b-2 border-slate-100">
                            <tr>
                              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950">Estudante</th>
                              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950">Cursos</th>
                              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950">Status Geral</th>
                              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y-2 divide-slate-50">
                            {studentList.map((studentEnrollments) => {
                              const enrollment = studentEnrollments[0]; // Primary record for student data
                              const approvedCount = studentEnrollments.filter(e => e.status === 'approved').length;
                              const pendingCount = studentEnrollments.filter(e => e.status === 'pending').length;
                              const scholarship = scholarships.find(s => s.studentId === enrollment.studentId);
                              
                              return (
                                <tr key={enrollment.studentData.cpf || enrollment.id} className="hover:bg-slate-50/30 transition-colors group">
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                      <div>
                                        <p className="font-black text-slate-950 text-base tracking-tight">{enrollment.studentData.fullName}</p>
                                        <p className="text-[10px] text-slate-500 font-black tracking-[0.15em] uppercase mt-1 flex items-center gap-2">
                                          <Phone className="w-3 h-3" /> {enrollment.studentData.phone}
                                        </p>
                                      </div>
                                      {scholarship?.status === 'active' && (
                                        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-2" title="Bolsista Ativo">
                                          <PiggyBank className="w-3 h-3" />
                                          <span className="text-[8px] font-black uppercase tracking-widest">Bolsista</span>
                                        </div>
                                      )}
                                      {studentEnrollments.length >= 2 && !scholarship && (
                                        <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-2" title="Elegível para Bolsa">
                                          <Plus className="w-3 h-3" />
                                          <span className="text-[8px] font-black uppercase tracking-widest">Elegível</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="flex flex-col gap-1">
                                      <span className="inline-flex items-center px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-indigo-50">
                                        {studentEnrollments.length} {studentEnrollments.length === 1 ? 'Matrícula' : 'Matrículas'}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2">
                                        {approvedCount} Ativas / {pendingCount} Pendentes
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <StatusBadge status={pendingCount > 0 ? 'pending' : (approvedCount > 0 ? 'approved' : 'rejected')} />
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-3">
                                      <button 
                                        onClick={() => handleViewEnrollment(enrollment)}
                                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-xl hover:shadow-indigo-50 rounded-2xl transition-all border-2 border-transparent hover:border-indigo-100"
                                        title="Ver Ficha / Detalhes"
                                      >
                                        <Eye className="w-5 h-5" />
                                      </button>
                                      <button 
                                        onClick={() => handleEditEnrollment(enrollment)}
                                        className="p-3 text-slate-400 hover:text-amber-500 hover:bg-white hover:shadow-xl hover:shadow-amber-50 rounded-2xl transition-all border-2 border-transparent hover:border-amber-100"
                                        title="Editar Dados Cadastrais"
                                      >
                                        <Edit2 className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                ) : (
                  <div className="bg-white rounded-2xl p-12 border border-slate-200 border-dashed text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LayoutDashboard className="w-8 h-8 text-slate-300" />
                    </div>
                    <h4 className="text-slate-900 font-bold uppercase tracking-tight">Nenhuma Matrícula Registrada</h4>
                    <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                      Para matricular um aluno, localize o curso desejado na lista acima e clique em <span className="font-bold text-indigo-600">"Matricular Aluno"</span>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="mt-24 pt-12 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex gap-6 label-caps text-[9px] text-slate-400">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setManualPrivacyShow(true);
                }}
                className="hover:text-slate-600 transition-colors"
              >
                Políticas de Privacidade
              </button>
              <a 
                href="https://wa.me/5571997401012" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-slate-600 transition-colors"
              >
                Suporte Técnico
              </a>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setShowUserManual(true);
                }}
                className="hover:text-slate-600 transition-colors"
              >
                Manual do Usuário
              </button>
              {isMasterAdmin && (
                <button 
                  onClick={() => setShowAdminPanel(true)}
                  className="flex items-center gap-2 text-indigo-600 font-black hover:text-indigo-800 transition-colors"
                >
                  <Crown className="w-3 h-3" /> Painel Master
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest underline decoration-slate-200 underline-offset-4">Servidor: BR-Sul-01</span>
            </div>
          </footer>
        </section>
      </main>

      {/* Course Creation Modal */}
      <AnimatePresence>
        {(showCourseForm || editingCourse) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCourseForm(false);
                setEditingCourse(null);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <div className="relative z-10 w-full max-w-xl">
              <CourseForm 
                courseId={editingCourse?.id}
                initialData={editingCourse || undefined}
                onSuccess={async () => {
                  setShowCourseForm(false);
                  setEditingCourse(null);
                  await Promise.all([fetchCourses(), fetchStats()]);
                  alert(editingCourse ? "Curso atualizado com sucesso!" : "Curso criado com sucesso!");
                }}
                onCancel={() => {
                  setShowCourseForm(false);
                  setEditingCourse(null);
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Enrollment Modal */}
      <AnimatePresence>
        {activeCourse && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCourse(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <div className="relative z-10 w-full max-w-2xl">
              <EnrollmentForm 
                courseId={activeCourse.id} 
                courseTitle={activeCourse.title}
                polo={activeCourse.polo || 'Salvador'}
                initialData={migratingStudentData || undefined}
                onSuccess={() => {
                  handleEnrollmentSuccess();
                  setMigratingStudentData(null);
                }}
                onCancel={() => {
                  setActiveCourse(null);
                  if (migratingStudentData) {
                    // Permanecer no modo migração se cancelar o form
                  }
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingEnrollment && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingEnrollment(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <div className="relative z-10 w-full max-w-2xl">
              <EnrollmentForm 
                courseId={editingEnrollment.courseId} 
                courseTitle={courses.find(c => c.id === editingEnrollment.courseId)?.title || 'Curso'}
                polo={editingEnrollment.polo || 'Salvador'}
                enrollmentId={editingEnrollment.id}
                initialData={editingEnrollment.studentData}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingEnrollment(null)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Preview Overlay */}
      <AnimatePresence>
        {isPreviewingPrint && viewingEnrollment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl h-full rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 no-print">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-600" /> Prévia de Impressão
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Confira os dados antes de gerar o documento</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPreviewingPrint(false)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={() => {
                      const element = document.querySelector('.print-area-enrollment');
                      if (!element || !(element instanceof HTMLElement)) return;
                      
                      const opt = {
                        margin: 0,
                        filename: `Ficha_${viewingEnrollment.studentData.fullName.replace(/\s+/g, '_')}.pdf`,
                        image: { type: 'jpeg' as const, quality: 0.98 },
                        html2canvas: { 
                          scale: 2, 
                          useCORS: true,
                          logging: false,
                          onclone: (clonedDoc: any) => {
                            // Inject a style to force HEX fallbacks and remove shadows/extra spacing
                            const style = clonedDoc.createElement('style');
                            style.innerHTML = `
                              * { 
                                color-scheme: light !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                              }
                              .print-container {
                                box-shadow: none !important;
                                border: none !important;
                                margin: 0 !important;
                              }
                            `;
                            clonedDoc.head.appendChild(style);
                          }
                        },
                        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
                      };
                      html2pdf().set(opt).from(element).save();
                    }}
                    className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Baixar PDF
                  </button>
                </div>
              </div>

              {/* Scrollable Preview Area */}
              <div className="flex-1 overflow-y-auto p-12 bg-slate-200/50 flex justify-center custom-scrollbar">
                {/* The "Paper" */}
                <div className="print-container print-area-enrollment bg-white w-full max-w-[210mm] h-[296mm] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-[2cm] relative text-slate-900 overflow-hidden">
                  
                  {/* Header do Documento */}
                  <div className="flex items-center justify-between border-b-4 border-slate-900 pb-8 mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white text-3xl font-black">CB</div>
                      <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Cursos Bantu</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Ficha Oficial de Matrícula</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Registro</p>
                      <p className="text-xl font-mono font-bold text-slate-900">#{viewingEnrollment.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    {/* Aluno & Curso Section */}
                    <div className="grid grid-cols-2 gap-12">
                      <section>
                        <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 border-b border-indigo-100 pb-2">Informações do Curso</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Curso Selecionado</p>
                            <p className="text-lg font-black text-slate-900 leading-tight">
                              {courses.find(c => c.id === viewingEnrollment.courseId)?.title || 'Curso Removido'}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Polo de Atendimento</p>
                              <p className="text-sm font-bold text-slate-900 uppercase">{viewingEnrollment.polo}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data da Inscrição</p>
                              <p className="text-sm font-bold text-slate-900">{new Date(viewingEnrollment.studentData.enrollmentDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4 border-b border-emerald-100 pb-2">Identificação do Aluno</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</p>
                            <p className="text-lg font-black text-slate-900 leading-tight">{viewingEnrollment.studentData.fullName}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CPF</p>
                              <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.cpf || 'Não Informado'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Nascimento</p>
                              <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.birthDate}</p>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* Contatos & Endereço */}
                    <div className="grid grid-cols-2 gap-12">
                      <section>
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-2">Localização</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Endereço Residencial</p>
                            <p className="text-sm font-bold text-slate-900 leading-relaxed">
                              {viewingEnrollment.studentData.address}, {viewingEnrollment.studentData.houseNumber}
                            </p>
                            <p className="text-xs text-slate-500 font-medium mb-3">{viewingEnrollment.studentData.neighborhood} — Ref: {viewingEnrollment.studentData.landmark}</p>
                            <div className="flex gap-4">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Situação Luz</p>
                                <p className={`text-xs font-bold ${isIrregular(viewingEnrollment.studentData.paysElectricity) ? 'text-rose-600' : 'text-slate-900'}`}>{formatSaneamento(viewingEnrollment.studentData.paysElectricity)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Situação Água</p>
                                <p className={`text-xs font-bold ${isIrregular(viewingEnrollment.studentData.paysWater) ? 'text-rose-600' : 'text-slate-900'}`}>{formatSaneamento(viewingEnrollment.studentData.paysWater)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-2">Filiação / Responsáveis</h4>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mãe / Pai</p>
                            <p className="text-sm font-bold text-slate-900 leading-tight">{viewingEnrollment.studentData.motherName}</p>
                            {viewingEnrollment.studentData.fatherName && (
                              <p className="text-sm font-bold text-slate-900 leading-tight mt-1">{viewingEnrollment.studentData.fatherName}</p>
                            )}
                          </div>
                          {viewingEnrollment.studentData.guardianName && (
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-indigo-600">Responsável Legal</p>
                              <p className="text-sm font-black text-indigo-900 leading-tight">{viewingEnrollment.studentData.guardianName}</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    {/* Escolaridade Section */}
                    <section className="bg-slate-50 p-8 rounded-2xl border-2 border-slate-100">
                      <h4 className="text-[11px] font-black text-slate-950 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" /> Dados Escolares
                      </h4>
                      <div className="grid grid-cols-3 gap-8">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Instituição</p>
                          <p className="text-xs font-bold text-slate-900">{viewingEnrollment.studentData.schoolName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Série / Ano</p>
                          <p className="text-xs font-bold text-slate-900">{viewingEnrollment.studentData.schoolGrade}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Turno</p>
                          <p className="text-xs font-bold text-slate-900 uppercase">{viewingEnrollment.studentData.shift}</p>
                        </div>
                      </div>
                    </section>

                    {/* Termos e Assinatura */}
                    <div className="pt-8 border-t-2 border-slate-100">
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic mb-16">
                        Declaro que as informações acima são verdadeiras e que estou ciente das normas de funcionamento do projeto Cursos Bantu. 
                        Este documento serve como comprovante oficial de matrícula ativa quando acompanhado do carimbo da instituição.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-20 pt-10">
                        <div className="text-center border-t border-slate-900 pt-3">
                          <p className="text-[10px] font-black uppercase tracking-widest">Assinatura do Responsável</p>
                        </div>
                        <div className="text-center border-t border-slate-900 pt-3">
                          <p className="text-[10px] font-black uppercase tracking-widest">Carimbo e Visto / Coordenação</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Rodapé */}
                  <div className="absolute bottom-[2cm] left-[2cm] right-[2cm] flex justify-between items-end grayscale opacity-30">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em]">Cursos Bantu & Matrículas © 2026</p>
                    <p className="text-[8px] font-mono tracking-tighter">TIMESTAMP: {new Date().toISOString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Student Data Sheet Preview Overlay */}
      <AnimatePresence>
        {isPreviewingFullEnrollmentPrint && viewingEnrollment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl h-full rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 no-print">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" /> Ficha Cadastral Completa
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Uso Interno da Instituição</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPreviewingFullEnrollmentPrint(false)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={() => {
                      const element = document.querySelector('.print-area-full-enrollment');
                      if (!element || !(element instanceof HTMLElement)) return;

                      const opt = {
                        margin: 5,
                        filename: `Ficha_Completa_${viewingEnrollment.studentData.fullName.replace(/\s+/g, '_')}.pdf`,
                        image: { type: 'jpeg' as const, quality: 0.98 },
                        html2canvas: { 
                          scale: 2, 
                          useCORS: true,
                          logging: false,
                          onclone: (clonedDoc: any) => {
                            const style = clonedDoc.createElement('style');
                            style.innerHTML = `
                              * { 
                                color-scheme: light !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                              }
                              .print-container {
                                box-shadow: none !important;
                                border: none !important;
                                margin: 0 !important;
                              }
                            `;
                            clonedDoc.head.appendChild(style);
                          }
                        },
                        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
                      };
                      html2pdf().set(opt).from(element).save();
                    }}
                    className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Baixar PDF Completo
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-slate-200/50 flex justify-center custom-scrollbar">
                <div className="print-container print-area-full-enrollment bg-white w-[210mm] h-[296mm] shadow-2xl p-[1.5cm] relative text-slate-900 border border-slate-100 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-900 rounded flex items-center justify-center text-white font-black text-xl">CB</div>
                      <div>
                        <h1 className="text-lg font-black uppercase tracking-tighter">Ficha Cadastral do Aluno</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Controle Administrativo - Cursos Bantu</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocolo</p>
                       <p className="text-sm font-bold uppercase">#{viewingEnrollment.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    {/* Identification */}
                    <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3 ml-1">1. Identificação do Aluno</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Nome Completo</p>
                          <p className="text-sm font-black uppercase">{viewingEnrollment.studentData.fullName}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Nascimento</p>
                          <p className="text-sm font-bold">{viewingEnrollment.studentData.birthDate} ({viewingEnrollment.studentData.age} anos)</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">CPF</p>
                          <p className="text-sm font-bold">{viewingEnrollment.studentData.cpf}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">RG</p>
                          <p className="text-sm font-bold">{viewingEnrollment.studentData.rg}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Contato</p>
                          <p className="text-sm font-bold">{viewingEnrollment.studentData.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Family */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3 ml-1">2. Filiação e Responsáveis</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Mãe</p>
                          <p className="text-xs font-bold uppercase">{viewingEnrollment.studentData.motherName}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Pai</p>
                          <p className="text-xs font-bold uppercase">{viewingEnrollment.studentData.fatherName || '-'}</p>
                        </div>
                        {viewingEnrollment.studentData.guardianName && (
                          <div className="pt-2 border-t border-slate-200">
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Responsável Legal</p>
                            <p className="text-xs font-black uppercase text-indigo-700">{viewingEnrollment.studentData.guardianName}</p>
                            <div className="flex gap-4 mt-1">
                              <p className="text-[7px] font-bold uppercase">CPF: {viewingEnrollment.studentData.guardianCpf}</p>
                              <p className="text-[7px] font-bold uppercase">RG: {viewingEnrollment.studentData.guardianRg}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Education */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3 ml-1">3. Dados Escolares</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Instituição</p>
                          <p className="text-xs font-bold uppercase">{viewingEnrollment.studentData.schoolName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Série / Ano</p>
                            <p className="text-xs font-bold uppercase">{viewingEnrollment.studentData.schoolGrade}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Turno</p>
                            <p className="text-xs font-bold uppercase">{viewingEnrollment.studentData.shift}</p>
                          </div>
                        </div>
                        {viewingEnrollment.studentData.integralDays && (
                          <p className="text-[7px] font-bold text-indigo-600 uppercase italic">Dias Integral: {viewingEnrollment.studentData.integralDays}</p>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3 ml-1">4. Localização Residencial</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2">
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Endereço</p>
                          <p className="text-xs font-bold uppercase">{viewingEnrollment.studentData.address}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Número</p>
                          <p className="text-xs font-bold uppercase">{viewingEnrollment.studentData.houseNumber}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Bairro</p>
                          <p className="text-xs font-bold uppercase">{viewingEnrollment.studentData.neighborhood}</p>
                        </div>
                        <div className="col-span-4 border-t border-slate-100 pt-2">
                           <p className="text-[8px] font-bold text-slate-400 uppercase">Ponto de Referência</p>
                           <p className="text-[10px] uppercase">{viewingEnrollment.studentData.landmark || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Socioeconomic */}
                    <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3 ml-1">5. Situação Socioeconômica</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Moradia</p>
                          <p className="text-[10px] font-bold uppercase">{viewingEnrollment.studentData.housingCondition}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Habitantes</p>
                          <p className="text-[10px] font-bold uppercase">{viewingEnrollment.studentData.householdCount}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Renda Per Capita</p>
                          <p className="text-[10px] font-bold uppercase">{viewingEnrollment.studentData.incomePerCapita}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Benefício Social</p>
                          <p className="text-[10px] font-bold uppercase">{viewingEnrollment.studentData.receivesBenefit}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Situação Luz</p>
                          <p className={`text-[10px] font-bold uppercase ${isIrregular(viewingEnrollment.studentData.paysElectricity) ? 'text-rose-600' : ''}`}>{formatSaneamento(viewingEnrollment.studentData.paysElectricity)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Situação Água</p>
                          <p className={`text-[10px] font-bold uppercase ${isIrregular(viewingEnrollment.studentData.paysWater) ? 'text-rose-600' : ''}`}>{formatSaneamento(viewingEnrollment.studentData.paysWater)}</p>
                        </div>
                        {viewingEnrollment.studentData.benefitDetail && (
                          <div className="col-span-4 border-t border-slate-100 pt-2">
                             <p className="text-[8px] font-bold text-slate-400 uppercase">Detalhes do Benefício</p>
                             <p className="text-[10px] uppercase font-bold text-indigo-600">{viewingEnrollment.studentData.benefitDetail}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-[2cm] left-[1.5cm] right-[1.5cm]">
                    <div className="grid grid-cols-2 gap-20 pt-10 border-t-2 border-slate-100">
                      <div className="text-center border-t border-slate-900 pt-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Responsável pela Inscrição</p>
                        <p className="text-[10px] font-black uppercase tracking-widest">{profile?.name}</p>
                      </div>
                      <div className="text-center border-t border-slate-900 pt-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Assinatura do Aluno / Responsável</p>
                      </div>
                    </div>
                    <div className="mt-12 flex justify-between items-end grayscale opacity-30">
                      <p className="text-[7px] font-black uppercase tracking-[0.3em]">Cursos Bantu - Ficha de Matrícula v2.0</p>
                      <p className="text-[7px] font-mono tracking-tighter">DATA: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Class Sheet Preview Overlay */}
      <AnimatePresence>
        {isPreviewingClassPrint && viewingClass && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-5xl h-full rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 no-print">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-600" /> Prévia da Listagem
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Visualize como ficará a folha de chamada</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPreviewingClassPrint(false)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={() => {
                      const element = document.querySelector('.print-area-class');
                      if (!element || !(element instanceof HTMLElement)) return;

                      const opt = {
                        margin: 0,
                        filename: `Lista_${viewingClass.title.replace(/\s+/g, '_')}.pdf`,
                        image: { type: 'jpeg' as const, quality: 0.98 },
                        html2canvas: { 
                          scale: 2, 
                          useCORS: true,
                          logging: false,
                          onclone: (clonedDoc: any) => {
                            const style = clonedDoc.createElement('style');
                            style.innerHTML = `
                              * { 
                                color-scheme: light !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                              }
                              .print-container {
                                box-shadow: none !important;
                                border: none !important;
                                margin: 0 !important;
                              }
                            `;
                            clonedDoc.head.appendChild(style);
                          }
                        },
                        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
                      };
                      html2pdf().set(opt).from(element).save();
                    }}
                    className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Baixar PDF
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-slate-200/50 flex justify-center custom-scrollbar">
                <div className="print-container print-area-class bg-white w-full max-w-[297mm] h-[209mm] shadow-2xl p-[1.5cm] relative text-slate-900 overflow-hidden">
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-900 rounded flex items-center justify-center text-white font-black text-xl">CB</div>
                      <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter">Diário de Classe / Frequência</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Curso: {viewingClass.title} • Polo: {viewingClass.polo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Período Letivo</p>
                       <p className="text-sm font-bold uppercase">Semestre 2026.1</p>
                    </div>
                  </div>

                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-slate-300 p-2 text-left uppercase font-black w-8">#</th>
                        <th className="border border-slate-300 p-2 text-left uppercase font-black">Aluno</th>
                        <th className="border border-slate-300 p-2 text-left uppercase font-black w-24">CPF</th>
                        <th className="border border-slate-300 p-2 text-center uppercase font-black w-8">P</th>
                        <th className="border border-slate-300 p-2 text-center uppercase font-black w-8">F</th>
                        <th className="border border-slate-300 p-2 text-left uppercase font-black">Assinatura / Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allEnrollments
                        .filter(e => e.courseId === viewingClass.id && e.status === 'approved')
                        .map((enrollment, idx) => (
                          <tr key={enrollment.id}>
                            <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                            <td className="border border-slate-300 p-2 font-black uppercase">{enrollment.studentData.fullName}</td>
                            <td className="border border-slate-300 p-2 font-mono">{enrollment.studentData.cpf}</td>
                            <td className="border border-slate-300 p-2"></td>
                            <td className="border border-slate-300 p-2"></td>
                            <td className="border border-slate-300 p-2"></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  <div className="mt-12 flex justify-between gap-12">
                     <div className="flex-1 border-t border-slate-400 pt-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Assinatura do Instrutor</p>
                     </div>
                     <div className="flex-1 border-t border-slate-400 pt-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Data da Aula</p>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Class Data Preview Overlay */}
      <AnimatePresence>
        {isPreviewingFullDataPrint && viewingClass && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-7xl h-full rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 no-print">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" /> Relatório Detalhado da Turma
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dados cadastrais completos de todos os alunos aprovados</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPreviewingFullDataPrint(false)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={() => {
                      const element = document.querySelector('.print-area-full-class');
                      if (!element || !(element instanceof HTMLElement)) return;

                      const opt = {
                        margin: 5,
                        filename: `Relatorio_Completo_${viewingClass.title.replace(/\s+/g, '_')}.pdf`,
                        image: { type: 'jpeg' as const, quality: 0.98 },
                        html2canvas: { 
                          scale: 2, 
                          useCORS: true,
                          logging: false,
                          onclone: (clonedDoc: any) => {
                            const style = clonedDoc.createElement('style');
                            style.innerHTML = `
                              * { 
                                color-scheme: light !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                              }
                              table { border-collapse: collapse !important; width: 100% !important; }
                              th, td { border: 1px solid #cbd5e1 !important; padding: 6px !important; }
                              .print-container {
                                box-shadow: none !important;
                                border: none !important;
                                margin: 0 !important;
                              }
                            `;
                            clonedDoc.head.appendChild(style);
                          }
                        },
                        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
                      };
                      html2pdf().set(opt).from(element).save();
                    }}
                    className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Baixar PDF Completo
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-slate-200/50 flex justify-center custom-scrollbar">
                <div className="print-container print-area-full-class bg-white w-[297mm] h-[209mm] shadow-2xl p-[1cm] relative text-slate-900 border border-slate-100 overflow-hidden">
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center text-white font-black text-lg">CB</div>
                      <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter">Relatório de Matrículas Ativas</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Turma: {viewingClass.title} | Polo: {viewingClass.polo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Extraído em</p>
                       <p className="text-[11px] font-bold uppercase">{new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  <table className="w-full text-[8.5px] border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="border border-slate-300 p-2 text-left uppercase font-black w-6">#</th>
                        <th className="border border-slate-300 p-2 text-left uppercase font-black">Aluno / Filiação</th>
                        <th className="border border-slate-300 p-2 text-left uppercase font-black w-20">Documentos</th>
                        <th className="border border-slate-300 p-2 text-left uppercase font-black w-18">Contato</th>
                        <th className="border border-slate-300 p-2 text-left uppercase font-black">Escola Atual</th>
                        <th className="border border-slate-300 p-2 text-left uppercase font-black">Endereço / Saneamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allEnrollments
                        .filter(e => e.courseId === viewingClass.id && e.status === 'approved')
                        .map((enrollment, idx) => (
                          <tr key={enrollment.id} className="align-top">
                            <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                            <td className="border border-slate-300 p-2">
                              <p className="font-black uppercase mb-1">{enrollment.studentData.fullName}</p>
                              <div className="text-[7.5px] text-slate-500 space-y-0.5">
                                <p><span className="font-bold">Mãe:</span> {enrollment.studentData.motherName}</p>
                                <p><span className="font-bold">Pai:</span> {enrollment.studentData.fatherName}</p>
                                <p><span className="font-bold">Resp.:</span> {enrollment.studentData.guardianName || '-'}</p>
                              </div>
                            </td>
                            <td className="border border-slate-300 p-2 space-y-1">
                              <p><span className="font-bold">CPF:</span> {enrollment.studentData.cpf}</p>
                              <p><span className="font-bold">RG:</span> {enrollment.studentData.rg}</p>
                              <p><span className="font-bold">Nasc:</span> {enrollment.studentData.birthDate}</p>
                            </td>
                            <td className="border border-slate-300 p-2">
                              <p className="font-bold uppercase mb-1">{enrollment.studentData.phone}</p>
                            </td>
                            <td className="border border-slate-300 p-2 space-y-1">
                              <p className="font-black uppercase">{enrollment.studentData.schoolName}</p>
                              <p>{enrollment.studentData.schoolGrade} • {enrollment.studentData.shift}</p>
                            </td>
                            <td className="border border-slate-300 p-2 space-y-1 text-[7.5px]">
                               <p className="font-bold uppercase">{enrollment.studentData.address}, {enrollment.studentData.houseNumber}</p>
                               <p className="uppercase text-slate-500">{enrollment.studentData.neighborhood}</p>
                               <div className="flex gap-2 mt-1 pt-1 border-t border-slate-100">
                                 <p><span className="font-bold">Luz:</span> <span className={isIrregular(enrollment.studentData.paysElectricity) ? 'text-rose-600' : ''}>{formatSaneamento(enrollment.studentData.paysElectricity)}</span></p>
                                 <p><span className="font-bold">Água:</span> <span className={isIrregular(enrollment.studentData.paysWater) ? 'text-rose-600' : ''}>{formatSaneamento(enrollment.studentData.paysWater)}</span></p>
                               </div>
                               {enrollment.studentData.landmark && <p className="italic text-[7px] text-slate-400 mt-0.5">Ref: {enrollment.studentData.landmark}</p>}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between">
                     <p className="text-[8px] font-bold text-slate-300">SISTEMA DE GESTÃO BANTU - ACESSO ADMINISTRATIVO</p>
                     <p className="text-[8px] font-bold text-slate-300">Página 1 de 1</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Enrollment Details Modal */}
      <AnimatePresence>
        {viewingEnrollment && !isPreviewingPrint && !isPreviewingFullEnrollmentPrint && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingEnrollment(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ficha do Aluno</h3>
                    <StatusBadge status={viewingEnrollment.status} />
                  </div>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Inscrição ID: {viewingEnrollment.id.slice(0, 8)}</p>
                </div>
                <button onClick={() => setViewingEnrollment(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

                <div className="flex flex-wrap justify-between px-8 pt-6 no-print gap-4">
                  <div className="flex gap-2 flex-1">
                    <button onClick={() => setIsPreviewingPrint(true)}
                      className="flex-1 flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Eye className="w-4 h-4" /> Ficha Aluno
                    </button>
                    <button onClick={() => setIsPreviewingFullEnrollmentPrint(true)}
                      className="flex-1 flex items-center justify-center gap-2 text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                    >
                      <FileText className="w-4 h-4" /> Ficha Interna
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      setMigratingStudentData(viewingEnrollment.studentData);
                      setViewingEnrollment(null);
                      // Scroll to courses
                      document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1 flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-100"
                  >
                    <Plus className="w-4 h-4" /> Inscrever em Outro Curso
                  </button>
                  <button 
                    onClick={() => {
                      handleEditEnrollment(viewingEnrollment);
                      setViewingEnrollment(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 text-amber-600 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-amber-100"
                  >
                    <Edit2 className="w-4 h-4" /> Editar Informações
                  </button>
                </div>

              <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar">
                {/* Courses Section */}
                <section>
                  <h4 className="label-caps mb-6 text-indigo-600 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Cursos Matriculados ({groupedEnrollments[viewingEnrollment.studentData.cpf || viewingEnrollment.studentData.fullName]?.length || 1})
                  </h4>
                  <div className="space-y-4">
                    {(groupedEnrollments[viewingEnrollment.studentData.cpf || viewingEnrollment.studentData.fullName] || [viewingEnrollment]).map((e) => {
                      const c = courses.find(course => course.id === e.courseId);
                      return (
                        <div key={e.id} className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl group hover:border-indigo-100 transition-all">
                          <div>
                            <p className="text-sm font-black text-slate-900">{c?.title || 'Curso Removido'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Polo: {e.polo} • Matrícula: {e.id.slice(0, 8)}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <StatusBadge status={e.status} />
                            <div className="flex gap-1 no-print">
                              {e.status === 'pending' && (
                                <>
                                  <button onClick={() => handleStatusUpdate(e.id, 'approved')} className="p-2 text-emerald-600 hover:bg-white rounded-lg transition-all" title="Aprovar">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleStatusUpdate(e.id, 'rejected')} className="p-2 text-rose-500 hover:bg-white rounded-lg transition-all" title="Recusar">
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button onClick={() => handleEnrollmentDelete(e.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Excluir">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Personal Info */}
                <section>
                  <h4 className="label-caps mb-6 text-indigo-600 flex items-center gap-2">
                    <User className="w-4 h-4" /> Dados Pessoais
                  </h4>
                  {(() => {
                    const studentEnrollments = groupedEnrollments[viewingEnrollment.studentData.cpf || viewingEnrollment.studentData.fullName] || [viewingEnrollment];
                    const scholarship = scholarships.find(s => s.studentId === viewingEnrollment.studentId);
                    const isEligible = studentEnrollments.length >= 2;

                    if (!scholarship && !isEligible) return null;

                    const status = scholarship?.status || (isEligible ? 'eligible' : 'none');
                    
                    return (
                      <div className={`mb-8 p-8 rounded-3xl border-2 transition-all overflow-hidden relative ${
                        status === 'active' ? 'bg-emerald-50/50 border-emerald-100 shadow-xl shadow-emerald-50/50' : 
                        status === 'eligible' ? 'bg-indigo-50/50 border-indigo-100 shadow-xl shadow-indigo-50/50' :
                        'bg-slate-50 border-slate-100'
                      }`}>
                        {/* Decorative background intensity */}
                        <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${
                          status === 'active' ? 'bg-emerald-400' : 'bg-indigo-400'
                        }`} />

                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
                                status === 'active' ? 'bg-emerald-500 text-white shadow-emerald-100' : 
                                status === 'eligible' ? 'bg-indigo-600 text-white shadow-indigo-100' :
                                'bg-slate-400 text-white shadow-slate-100'
                              }`}>
                                <PiggyBank className="w-7 h-7" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                                    status === 'active' ? 'text-emerald-600' : 'text-indigo-600'
                                  }`}>
                                    {status === 'active' ? 'Benefício Concedido' : 'Direito à Bolsa Identificado'}
                                  </span>
                                </div>
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                  {status === 'active' ? 'Bolsista Ativo' : 'Elegível para Bolsa'}
                                </h4>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Auxílio Mensal</p>
                              <p className={`text-2xl font-black font-mono transition-all ${
                                status === 'active' ? 'text-emerald-700' : 'text-slate-900'
                              }`}>
                                R$ {scholarshipConfig?.monthlyValue || '---'}
                              </p>
                            </div>
                          </div>

                          <div className={`p-5 rounded-2xl border ${
                            status === 'active' ? 'bg-white border-emerald-50' : 'bg-white border-indigo-50'
                          }`}>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3" /> Benefícios Inclusos
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {scholarshipConfig?.benefits && scholarshipConfig.benefits.length > 0 ? (
                                scholarshipConfig.benefits.map((b, i) => (
                                  <span key={i} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all hover:scale-105 ${
                                    status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                  }`}>
                                    {b}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 italic">Nenhum benefício extra configurado</span>
                              )}
                            </div>
                          </div>

                          {status === 'eligible' && (
                            <div className="mt-4 flex items-center gap-3 bg-indigo-600/5 p-3 rounded-xl border border-indigo-100/50">
                              <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
                              <p className="text-[9px] font-bold text-indigo-700 uppercase tracking-tight">
                                Aguardando ativação administrativa (Fluxo Automático de 2+ Cursos)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Data da Matrícula</p>
                      <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.enrollmentDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Nome Completo</p>
                      <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Telefone</p>
                      <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Data de Nascimento</p>
                      <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.birthDate} ({viewingEnrollment.studentData.age} anos)</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Documentos</p>
                      <p className="text-sm font-bold text-slate-900">CPF: {viewingEnrollment.studentData.cpf} / RG: {viewingEnrollment.studentData.rg}</p>
                    </div>
                  </div>
                </section>

                {/* Guardian Info for Minors */}
                {parseInt(viewingEnrollment.studentData.age) < 18 && (
                  <section className="bg-amber-50/30 p-6 rounded-2xl border-2 border-amber-100/50">
                    <h4 className="label-caps mb-6 text-amber-700 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Responsável Legal
                    </h4>
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] text-amber-600/70 font-black uppercase tracking-widest mb-1">Nome do Responsável</p>
                        <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.guardianName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-12">
                        <div>
                          <p className="text-[10px] text-amber-600/70 font-black uppercase tracking-widest mb-1">CPF do Responsável</p>
                          <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.guardianCpf}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-600/70 font-black uppercase tracking-widest mb-1">RG do Responsável</p>
                          <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.guardianRg}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Family */}
                <section>
                  <h4 className="label-caps mb-6 text-indigo-600 flex items-center gap-2">
                    <Home className="w-4 h-4" /> Família e Endereço
                  </h4>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-12">
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Nome da Mãe</p>
                        <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.motherName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Nome do Pai</p>
                        <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.fatherName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Endereço Residencial</p>
                      <p className="text-sm font-bold text-slate-900 leading-relaxed">
                        {viewingEnrollment.studentData.address}, {viewingEnrollment.studentData.houseNumber}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-12">
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Bairro</p>
                        <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.neighborhood}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Ponto de Referência</p>
                        <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.landmark || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Education */}
                <section>
                  <h4 className="label-caps mb-6 text-indigo-600 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Escolaridade
                  </h4>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Escola</p>
                      <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.schoolName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Série / Ano</p>
                      <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.schoolGrade}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Turno</p>
                      <p className="text-sm font-bold text-slate-900">
                        {viewingEnrollment.studentData.shift}
                        {viewingEnrollment.studentData.shift === 'Integral' && viewingEnrollment.studentData.integralDays && ` (${viewingEnrollment.studentData.integralDays})`}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Socioeconomic */}
                <section>
                  <h4 className="label-caps mb-6 text-indigo-600 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Socioeconômico
                  </h4>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Moradia</p>
                      <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.housingCondition}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Habitantes / Renda PC</p>
                      <p className="text-sm font-bold text-slate-900">{viewingEnrollment.studentData.householdCount} pessoas / {viewingEnrollment.studentData.incomePerCapita}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Benefícios Sociais</p>
                      <p className="text-sm font-bold text-slate-900">
                        {viewingEnrollment.studentData.receivesBenefit === 'SIM' ? `Sim: ${viewingEnrollment.studentData.benefitDetail}` : 'Não recebe benefícios'}
                      </p>
                    </div>
                     <div className="col-span-2 grid grid-cols-2 gap-12 pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Situação da Luz</p>
                        <p className={`text-sm font-bold ${isIrregular(viewingEnrollment.studentData.paysElectricity) ? 'text-rose-600' : 'text-slate-900'}`}>{formatSaneamento(viewingEnrollment.studentData.paysElectricity)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Situação da Água</p>
                        <p className={`text-sm font-bold ${isIrregular(viewingEnrollment.studentData.paysWater) ? 'text-rose-600' : 'text-slate-900'}`}>{formatSaneamento(viewingEnrollment.studentData.paysWater)}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 no-print">
                {viewingEnrollment.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleStatusUpdate(viewingEnrollment.id, 'approved')}
                      className="flex-1 bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Aprovar Matrícula
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(viewingEnrollment.id, 'rejected')}
                      className="flex-1 bg-white border border-slate-200 text-rose-500 font-black uppercase tracking-widest text-[11px] py-4 rounded-xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Recusar Inscrição
                    </button>
                  </>
                )}
                {viewingEnrollment.status !== 'pending' && (
                  <button 
                    onClick={() => setViewingEnrollment(null)}
                    className="flex-1 bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
                  >
                    Fechar Visualização
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Class List Modal */}
      <AnimatePresence>
        {viewingClass && !isPreviewingClassPrint && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingClass(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-4xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 no-print">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">Listagem de Turma</h3>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">{viewingClass.title}</span>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total: {allEnrollments.filter(e => e.courseId === viewingClass.id && e.status === 'approved').length} Alunos Aprovados</span>
                  </div>
                </div>
                <button onClick={() => setViewingClass(null)} className="p-3 hover:bg-white hover:shadow-lg rounded-2xl transition-all text-slate-400 border border-transparent hover:border-slate-100">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
                <table className="w-full text-left font-sans text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-100">
                      <th className="pb-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Aluno</th>
                      <th className="pb-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">CPF / RG</th>
                      <th className="pb-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Telefone</th>
                      <th className="pb-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Escola</th>
                      <th className="pb-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allEnrollments
                      .filter(e => e.courseId === viewingClass.id)
                      .map((enrollment) => (
                        <tr key={enrollment.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => handleViewEnrollment(enrollment)}>
                          <td className="py-6 pr-4">
                            <p className="font-black text-slate-950 text-base leading-tight">{enrollment.studentData.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Data: {enrollment.studentData.enrollmentDate}</p>
                          </td>
                          <td className="py-6 pr-4">
                            <p className="text-slate-600 font-medium">CPF: {enrollment.studentData.cpf}</p>
                            <p className="text-[10px] text-slate-400">RG: {enrollment.studentData.rg}</p>
                          </td>
                          <td className="py-6 pr-4">
                            <div className="flex items-center gap-2 text-slate-600 font-black">
                              <Phone className="w-3.5 h-3.5 text-indigo-500" />
                              {enrollment.studentData.phone}
                            </div>
                          </td>
                          <td className="py-6 pr-4">
                            <p className="text-slate-600 font-medium max-w-[150px] truncate">{enrollment.studentData.schoolName}</p>
                            <p className="text-[10px] text-slate-400">{enrollment.studentData.schoolGrade}</p>
                          </td>
                          <td className="py-6 text-right">
                             <StatusBadge status={enrollment.status} />
                          </td>
                        </tr>
                      ))}
                    {allEnrollments.filter(e => e.courseId === viewingClass.id).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Nenhum aluno matriculado nesta turma ainda.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-between items-center no-print">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Documento Interno Bantu v1.0</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsPreviewingFullDataPrint(true)}
                    className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Relatório Completo
                  </button>
                  <button 
                    onClick={() => setIsPreviewingClassPrint(true)}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Diário de Chamada
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {isEnrollmentSuccess && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-[70] border border-slate-700"
          >
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold uppercase tracking-widest text-xs">Solicitação Enviada</p>
              <p className="text-[10px] text-slate-400 font-medium">Sua matrícula está em análise técnica.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrivacyNotice && (
          <PrivacyModal onAccept={handleAcceptTerms} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {manualPrivacyShow && (
          <PrivacyModal 
            onAccept={handleAcceptTerms} 
            acceptedAt={profile?.acceptedTermsAt}
            onClose={() => setManualPrivacyShow(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUserManual && (
          <UserManualModal 
            onClose={() => setShowUserManual(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminPanel && (isAdmin || isMasterAdmin) && (
          <AdminPanelModal 
            onClose={() => setShowAdminPanel(false)}
            initialTab={adminPanelTab}
            onDataUpdate={() => {
              fetchAllEnrollments();
              fetchScholarshipData();
            }}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showTeacherPanel && (
          <TeacherPanelModal 
            onClose={() => setShowTeacherPanel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
