import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Users, 
  ClipboardCheck, 
  BookOpen, 
  X, 
  Activity,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User,
  Calendar,
  Clock,
  FileSpreadsheet,
  Save,
  ChevronLeft,
  Check,
  History
} from 'lucide-react';
import { 
  getCourses, 
  getAllEnrollments, 
  Course, 
  Enrollment, 
  UserProfile,
  saveAttendance,
  getAttendanceByCourse,
  GradeRecord,
  saveStudentGrades,
  getGradesByCourse,
  AttendanceRecord,
  getStudentScholarships,
  getScholarshipConfig,
  StudentScholarship,
  ScholarshipConfig
} from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { PiggyBank } from 'lucide-react';

interface TeacherPanelModalProps {
  onClose: () => void;
}

export const TeacherPanelModal: React.FC<TeacherPanelModalProps> = ({ onClose }) => {
  const { user, profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'classes' | 'attendance' | 'history' | 'grades'>('classes');
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
  const [scholarships, setScholarships] = useState<StudentScholarship[]>([]);
  const [scholarshipConfig, setScholarshipConfig] = useState<ScholarshipConfig | null>(null);

  // Grades editing state
  const [editingGrades, setEditingGrades] = useState<{ [studentId: string]: { a1: string; a2: string } }>({});
  
  // Attendance session state
  const [isTakingAttendance, setIsTakingAttendance] = useState(false);
  const [attendanceList, setAttendanceList] = useState<{ id: string; studentId: string; studentName: string; status: 'present' | 'absent' }[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCourses, allEnrollments, allScholarships, config] = await Promise.all([
        getCourses(),
        getAllEnrollments(),
        getStudentScholarships(),
        getScholarshipConfig()
      ]);
      
      const teacherCourses = isAdmin 
        ? allCourses 
        : allCourses.filter(c => c.instructorId === user?.uid);
        
      setCourses(teacherCourses);
      setEnrollments(allEnrollments);
      setScholarships(allScholarships);
      setScholarshipConfig(config);
    } catch (error) {
      console.error("Error loading teacher data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedCourse) {
      loadAttendanceHistory(selectedCourse.id);
    }
  }, [selectedCourse]);

  const loadAttendanceHistory = async (courseId: string) => {
    const [history, grades] = await Promise.all([
      getAttendanceByCourse(courseId),
      getGradesByCourse(courseId)
    ]);
    setAttendanceHistory(history);
    setGradeRecords(grades);
    
    // Initialize editing state
    const initialGrades: { [studentId: string]: { a1: string; a2: string } } = {};
    grades.forEach(g => {
      initialGrades[g.studentId] = {
        a1: g.grades.find(gr => gr.label === 'A1')?.value.toString() || '',
        a2: g.grades.find(gr => gr.label === 'A2')?.value.toString() || ''
      };
    });
    setEditingGrades(initialGrades);
  };

  const getStudentsForCourse = (courseId: string) => {
    return enrollments.filter(e => e.courseId === courseId && e.status === 'approved');
  };

  const [searchTerm, setSearchTerm] = useState('');

  const startAttendance = () => {
    if (!selectedCourse) return;
    const students = getStudentsForCourse(selectedCourse.id);
    setAttendanceList(students.map((s, idx) => ({
      id: s.id || `temp-${idx}-${Date.now()}`,
      studentId: s.studentId,
      studentName: s.studentData.fullName,
      status: 'present'
    })));
    setSearchTerm('');
    setIsTakingAttendance(true);
  };

  const toggleAttendanceStatus = (id: string) => {
    setAttendanceList(prev => prev.map(item => 
      item.id === id 
        ? { ...item, status: item.status === 'present' ? 'absent' : 'present' }
        : item
    ));
  };

  const setAllStatus = (status: 'present' | 'absent') => {
    setAttendanceList(prev => prev.map(item => ({ ...item, status })));
  };

  const filteredAttendance = attendanceList.filter(item => 
    item.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAttendanceChange = (studentId: string, field: 'a1' | 'a2', val: string) => {
    setEditingGrades(prev => ({
      ...prev,
      [studentId]: {
        a1: prev[studentId]?.a1 || '',
        a2: prev[studentId]?.a2 || '',
        [field]: val
      }
    }));
  };

  const handleSaveGrades = async (student: Enrollment) => {
    if (!selectedCourse) return;
    const gradesData = editingGrades[student.studentId] || { a1: '', a2: '' };
    const a1 = parseFloat(gradesData.a1) || 0;
    const a2 = parseFloat(gradesData.a2) || 0;
    const average = (a1 + a2) / 2;

    try {
      await saveStudentGrades({
        courseId: selectedCourse.id,
        studentId: student.studentId,
        studentName: student.studentData.fullName,
        grades: [
          { label: 'A1', value: a1 },
          { label: 'A2', value: a2 }
        ],
        finalAverage: average,
        updatedAt: new Date()
      });
      loadAttendanceHistory(selectedCourse.id);
    } catch (error) {
      alert("Erro ao salvar notas.");
    }
  };

  const calculateFrequency = (studentId: string) => {
    if (attendanceHistory.length === 0) return 100;
    const totalClasses = attendanceHistory.length;
    const presences = attendanceHistory.filter(record => 
      record.attendees.find(a => a.studentId === studentId && a.status === 'present')
    ).length;
    return Math.round((presences / totalClasses) * 100);
  };
  const handleSaveAttendance = async () => {
    if (!selectedCourse || !user) return;
    
    setIsSaving(true);
    try {
      await saveAttendance({
        courseId: selectedCourse.id,
        date: attendanceDate,
        teacherId: user.uid,
        attendees: filteredAttendance.map(({ studentId, studentName, status }) => ({
          studentId,
          studentName,
          status
        })),
        createdAt: new Date()
      });
      setIsTakingAttendance(false);
      loadAttendanceHistory(selectedCourse.id);
      alert("Chamada registrada com sucesso!");
    } catch (error) {
      alert("Erro ao salvar chamada.");
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl rotate-2">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Espaço do Professor</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                Gestão Pedagógica 
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                {profile?.name}
              </p>
            </div>
          </div>

          {!isTakingAttendance && (
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button 
                onClick={() => setActiveTab('classes')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'classes' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <BookOpen className="w-4 h-4" /> Minhas Turmas
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <History className="w-4 h-4" /> Histórico Chamadas
              </button>
              <button 
                onClick={() => setActiveTab('grades')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'grades' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Notas e Frequência
              </button>
            </div>
          )}

          {isTakingAttendance && (
            <div className="flex items-center gap-4">
              <input 
                type="date" 
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold font-sans outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                onClick={() => setIsTakingAttendance(false)}
                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
              >
                Cancelar
              </button>
            </div>
          )}

          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-400 hover:text-slate-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-slate-50/30 flex lg:flex-row flex-col">
          {/* Main List */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar border-r border-slate-100">
            {isTakingAttendance ? (
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                   <div>
                     <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Registro de Presença</h3>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{selectedCourse?.title}</p>
                   </div>
                   <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2 text-xs font-black uppercase tracking-widest shrink-0">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     {attendanceList.filter(a => a.status === 'present').length} Presentes
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="text"
                      placeholder="Buscar aluno na chamada..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold font-sans outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setAllStatus('present')}
                      className="flex-1 bg-emerald-50 text-emerald-600 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all"
                    >
                      Presente Todos
                    </button>
                    <button 
                      onClick={() => setAllStatus('absent')}
                      className="flex-1 bg-rose-50 text-rose-600 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all"
                    >
                      Faltou Todos
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-10 max-h-[400px] overflow-y-auto px-1 -mx-1 custom-scrollbar">
                  {filteredAttendance.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleAttendanceStatus(item.id)}
                      className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all group ${item.status === 'present' ? 'bg-white border-emerald-100 shadow-lg shadow-emerald-50' : 'bg-slate-50 border-transparent opacity-60'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all ${item.status === 'present' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-400'}`}>
                          {item.studentName.slice(0, 2).toUpperCase()}
                        </div>
                          <div className="text-left">
                          <div className="flex items-center gap-2">
                             <p className="text-sm font-black text-slate-900 uppercase">{item.studentName}</p>
                             {(() => {
                               const scholarship = scholarships.find(s => s.studentId === item.studentId);
                               const studentEnrs = enrollments.filter(e => e.studentId === item.studentId && e.status === 'approved');
                               const isEligible = studentEnrs.length >= 2;
                               
                               if (scholarship?.status === 'active') {
                                 return (
                                   <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100" title="Bolsista Ativo">
                                      <PiggyBank className="w-3 h-3" />
                                      <span className="text-[7px] font-black uppercase">Ativa</span>
                                   </div>
                                 );
                               } else if (isEligible) {
                                 return (
                                   <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100" title="Direito a Bolsa (2+ Cursos)">
                                      <PiggyBank className="w-3 h-3" />
                                      <span className="text-[7px] font-black uppercase">Bolsista</span>
                                   </div>
                                 );
                               }
                               return null;
                             })()}
                          </div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'present' ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {item.status === 'present' ? 'Presente' : 'Ausente'}
                          </p>
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${item.status === 'present' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                        {item.status === 'present' ? <Check className="w-5 h-5" /> : <X className="w-4 h-4" />}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSaveAttendance}
                  disabled={isSaving}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
                >
                  {isSaving ? <Activity className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Finalizar e Salvar Chamada
                </button>
              </div>
            ) : activeTab === 'grades' ? (
              <div className="max-w-5xl mx-auto">
                 <div className="flex items-center justify-between mb-8">
                   <div>
                     <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Notas e Frequência</h3>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{selectedCourse?.title}</p>
                   </div>
                   <div className="flex gap-4">
                     <div className="bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Aulas Realizadas</p>
                        <p className="text-sm font-black text-slate-900">{attendanceHistory.length}</p>
                     </div>
                   </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aluno</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Frequência</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nota 01 (A1)</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nota 02 (A2)</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Média</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedCourse && getStudentsForCourse(selectedCourse.id).map((student) => {
                        const freq = calculateFrequency(student.studentId);
                        const grades = editingGrades[student.studentId] || { a1: '', a2: '' };
                        const gA1 = grades.a1 || '';
                        const gA2 = grades.a2 || '';
                        const avg = (parseFloat(gA1 || '0') + parseFloat(gA2 || '0')) / 2;
                        
                        return (
                          <tr key={student.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="text-xs font-black text-slate-900 uppercase">{student.studentData.fullName}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{student.studentData.cpf}</p>
                                </div>
                                {(() => {
                                  const scholarship = scholarships.find(s => s.studentId === student.studentId);
                                  const studentEnrs = enrollments.filter(e => e.studentId === student.studentId && e.status === 'approved');
                                  const isEligible = studentEnrs.length >= 2;
                                  
                                  if (scholarship?.status === 'active') {
                                    return (
                                      <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-100" title="Bolsista Ativo">
                                        <PiggyBank className="w-3.5 h-3.5" />
                                      </div>
                                    );
                                  } else if (isEligible) {
                                    return (
                                      <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg border border-indigo-100" title="Direito a Bolsa (2+ Cursos)">
                                        <PiggyBank className="w-3.5 h-3.5" />
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <div className="inline-flex flex-col items-center">
                                 <span className={`text-xs font-black ${freq < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>{freq}%</span>
                                 <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                   <div className={`h-full ${freq < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${freq}%` }} />
                                 </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <input 
                                type="number" 
                                min="0" max="10" step="0.5"
                                value={gA1}
                                onChange={(e) => handleAttendanceChange(student.studentId, 'a1', e.target.value)}
                                className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <input 
                                type="number" 
                                min="0" max="10" step="0.5"
                                value={gA2}
                                onChange={(e) => handleAttendanceChange(student.studentId, 'a2', e.target.value)}
                                className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-sm font-black ${avg < 6 ? 'text-rose-600' : 'text-indigo-600'}`}>
                                {avg.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <button 
                                 onClick={() => handleSaveGrades(student)}
                                 className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all group shadow-sm border border-indigo-100"
                               >
                                 <Save className="w-4 h-4" />
                               </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'history' ? (
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8">Histórico de Chamadas</h3>
                {attendanceHistory.length === 0 ? (
                  <div className="text-center py-20">
                     <History className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                     <p className="text-slate-400 font-bold uppercase text-xs">Nenhum registro encontrado para esta turma</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attendanceHistory.map((record) => (
                      <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                             <Calendar className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase">{record.date.split('-').reverse().join('/')}</span>
                          </div>
                          <span className="text-[9px] font-black text-slate-300 uppercase">#{record.id?.slice(0, 6)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <div>
                             <p className="text-sm font-black text-slate-900 leading-none">{record.attendees.filter(a => a.status === 'present').length} Presentes</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">De {record.attendees.length} Alunos</p>
                           </div>
                           <Activity className="w-6 h-6 text-slate-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => {
                  const students = getStudentsForCourse(course.id);
                  return (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className={`text-left p-6 rounded-3xl border-2 transition-all group relative overflow-hidden ${selectedCourse?.id === course.id ? 'bg-white border-indigo-600 shadow-2xl shadow-indigo-100' : 'bg-white border-white hover:border-slate-200 shadow-sm'}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl transition-colors ${selectedCourse?.id === course.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{course.polo}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-1 leading-tight">{course.title}</h4>
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Users className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase">{students.length} Alunos</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase">{course.duration}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar - Details & Actions */}
          {!isTakingAttendance && (
            <div className="w-full lg:w-[400px] bg-white border-l border-slate-100 flex flex-col shrink-0">
              {selectedCourse ? (
                <div className="flex flex-col h-full">
                  <div className="p-8 border-b border-slate-50">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                          Painel da Turma
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9]">{selectedCourse.title}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Alunos</p>
                          <p className="text-2xl font-black text-slate-900 leading-none">{getStudentsForCourse(selectedCourse.id).length}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vagas</p>
                          <p className="text-2xl font-black text-slate-900 leading-none">{selectedCourse.capacity}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Lista de Alunos Ativos
                    </h4>
                    <div className="space-y-3">
                      {getStudentsForCourse(selectedCourse.id).map((student) => (
                        <div key={student.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-all group">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs uppercase group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                            {student.studentData.fullName.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black text-slate-900 uppercase truncate">{student.studentData.fullName}</p>
                              {scholarships.find(s => s.studentId === student.studentId)?.status === 'active' && (
                                <PiggyBank className="w-3 h-3 text-emerald-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{student.studentData.phone}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 transition-all" />
                        </div>
                      ))}
                      {getStudentsForCourse(selectedCourse.id).length === 0 && (
                        <div className="text-center py-10">
                          <AlertCircle className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-slate-300 uppercase">Nenhum aluno aprovado</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-3">
                    <button 
                      onClick={startAttendance}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98]"
                    >
                      <ClipboardCheck className="w-5 h-5" /> Fazer Chamada
                    </button>
                    <button 
                      onClick={() => setActiveTab('grades')}
                      className="w-full bg-white text-slate-900 border-2 border-slate-100 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
                    >
                      <FileSpreadsheet className="w-5 h-5" /> Notas e Frequência
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 border-2 border-dashed border-slate-200">
                    <Activity className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tighter">Selecione uma turma</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed mt-2 max-w-[200px]">
                    Escolha uma turma ao lado para gerenciar alunos e diário de classe.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
