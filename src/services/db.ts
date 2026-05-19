import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Detect Resource Exhaustion / Quota Issues early
  const isQuotaExceeded = errorMessage.includes('Resource-Exhausted') || 
                         errorMessage.includes('quota exceeded') ||
                         errorMessage.includes('exhausted maximum allowed queued writes');

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Alert user specifically for high-level resource issues
  if (isQuotaExceeded) {
    const msg = 'LOTAÇÃO DE DADOS: O sistema atingiu o limite de uso diário do servidor. Por favor, tente novamente em algumas horas ou amanhã.';
    console.error(msg);
    // We throw a more readable error that the UI can catch and show
    throw new Error(msg);
  }

  throw new Error(JSON.stringify(errInfo));
}

// Types
export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  polo: 'Salvador' | 'Ilha';
  duration: string;
  instructor: string;
  instructorId?: string;
  capacity: number;
  status: 'open' | 'closed';
  imageUrl?: string;
  createdAt: any;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  staffId: string;
  polo: 'Salvador' | 'Ilha';
  status: 'pending' | 'approved' | 'rejected';
  studentData: {
    enrollmentDate: string;
    fullName: string;
    birthDate: string;
    age: string;
    phone: string;
    cpf: string;
    rg: string;
    motherName: string;
    fatherName: string;
    address: string;
    neighborhood: string;
    houseNumber: string;
    landmark: string;
    schoolName: string;
    schoolGrade: string;
    shift: 'Matutino' | 'Vespertino' | 'Integral' | 'Noturno';
    integralDays?: string;
    householdCount: string;
    housingCondition: 'Própria' | 'Alugada' | 'Outros';
    incomePerCapita: string;
    receivesBenefit: 'SIM' | 'NÃO';
    benefitDetail?: string;
    paysElectricity: 'SIM' | 'NÃO';
    paysWater: 'SIM' | 'NÃO';
    guardianName?: string;
    guardianCpf?: string;
    guardianRg?: string;
  };
  createdAt: any;
  updatedAt: any;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'teacher';
  acceptedTermsAt?: any;
  acceptedTermsIP?: string;
  acceptedTermsVersion?: string;
  lastAccessAt?: any;
  photoURL?: string; // Added photourl
}

export interface AuditLog {
  id?: string;
  userId: string;
  userName?: string;
  action: string;
  resourceId?: string;
  resourceType?: string;
  details?: string;
  ip?: string;
  timestamp: any;
}

export const getUsers = async (): Promise<UserProfile[]> => {
  try {
    const q = query(collection(db, 'users'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as any as UserProfile));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
};

export const getUserById = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
};

export const saveUser = async (profile: UserProfile) => {
  try {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, {
      ...profile,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
  }
};

export const updateUserRole = async (userId: string, role: 'student' | 'admin' | 'teacher') => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
};

export const getAuditLogs = async (limitNum: number = 100): Promise<AuditLog[]> => {
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(limitNum));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as AuditLog));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'audit_logs');
    return [];
  }
};

export const getCourses = async (): Promise<Course[]> => {
  try {
    const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  } catch (error: any) {
    handleFirestoreError(error, OperationType.LIST, 'courses');
    return [];
  }
};

export const getCourseById = async (id: string): Promise<Course | null> => {
  try {
    const d = await getDoc(doc(db, 'courses', id));
    return d.exists() ? ({ id: d.id, ...d.data() } as Course) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `courses/${id}`);
    return null;
  }
};

export const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'courses'), {
      ...courseData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'courses');
  }
};

export const updateCourse = async (courseId: string, courseData: Partial<Course>) => {
  try {
    const docRef = doc(db, 'courses', courseId);
    await updateDoc(docRef, {
      ...courseData,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `courses/${courseId}`);
  }
};

export const deleteCourse = async (courseId: string) => {
  try {
    const docRef = doc(db, 'courses', courseId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `courses/${courseId}`);
  }
};

export const createEnrollment = async (enrollmentData: Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'enrollments'), {
      ...enrollmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'enrollments');
  }
};

export const getEnrollmentsByStudent = async (studentId: string): Promise<Enrollment[]> => {
  try {
    const q = query(
      collection(db, 'enrollments'), 
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'enrollments');
    return [];
  }
};

export const getAllEnrollments = async (): Promise<Enrollment[]> => {
  try {
    const q = query(collection(db, 'enrollments'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));
  } catch (error: any) {
    handleFirestoreError(error, OperationType.LIST, 'enrollments');
    return [];
  }
};

export const getApprovedEnrollmentsCount = async (): Promise<number> => {
  try {
    const q = query(collection(db, 'enrollments'), where('status', '==', 'approved'));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.warn("Could not get approved count from server", error);
    return 0;
  }
};

export const getTotalEnrollmentsCount = async (): Promise<number> => {
  try {
    const q = query(collection(db, 'enrollments'));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.warn("Could not get total enrollment count", error);
    return 0;
  }
};

export const updateEnrollment = async (enrollmentId: string, enrollmentData: Partial<Enrollment>) => {
  try {
    const docRef = doc(db, 'enrollments', enrollmentId);
    await updateDoc(docRef, {
      ...enrollmentData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `enrollments/${enrollmentId}`);
  }
};

export const updateEnrollmentStatus = async (enrollmentId: string, status: Enrollment['status']) => {
  try {
    const docRef = doc(db, 'enrollments', enrollmentId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `enrollments/${enrollmentId}`);
  }
};

export const deleteEnrollment = async (enrollmentId: string) => {
  try {
    const docRef = doc(db, 'enrollments', enrollmentId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `enrollments/${enrollmentId}`);
  }
};

export const acceptTerms = async (userId: string, metadata: { ip: string; version: string }) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      acceptedTermsAt: serverTimestamp(),
      acceptedTermsIP: metadata.ip,
      acceptedTermsVersion: metadata.version,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
};

export const createAuditLog = async (logData: Omit<AuditLog, 'id' | 'timestamp'>) => {
  try {
    let currentIP = '---';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
      const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      currentIP = data.ip;
    } catch {
      // Ignore IP fetch error for logs
    }

    await addDoc(collection(db, 'audit_logs'), {
      ...logData,
      ip: currentIP,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.warn("Could not create audit log", error);
  }
};

export const logUserAccess = async (userId: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      lastAccessAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    // Fail silently for logs to not interrupt flow
    console.warn("Could not log access", error);
  }
};

export interface AttendanceRecord {
  id?: string;
  courseId: string;
  date: string; // YYYY-MM-DD
  teacherId: string;
  attendees: {
    studentId: string;
    studentName: string;
    status: 'present' | 'absent';
  }[];
  createdAt: any;
}

export const saveAttendance = async (data: Omit<AttendanceRecord, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'attendance'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'attendance');
    throw error;
  }
};

export const getAttendanceByCourse = async (courseId: string) => {
  try {
    const q = query(
      collection(db, 'attendance'),
      where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord))
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `attendance/${courseId}`);
    return [];
  }
};

export interface GradeRecord {
  id?: string;
  courseId: string;
  studentId: string;
  studentName: string;
  grades: {
    label: string; // e.g., 'A1', 'A2', 'Final'
    value: number;
  }[];
  finalAverage?: number;
  updatedAt: any;
}

export const saveStudentGrades = async (data: Omit<GradeRecord, 'id'>) => {
  try {
    const q = query(
      collection(db, 'grades'),
      where('courseId', '==', data.courseId),
      where('studentId', '==', data.studentId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docId = snapshot.docs[0].id;
      await updateDoc(doc(db, 'grades', docId), {
        ...data,
        updatedAt: serverTimestamp()
      });
      return docId;
    } else {
      const docRef = await addDoc(collection(db, 'grades'), {
        ...data,
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'grades');
    throw error;
  }
};

export const getGradesByCourse = async (courseId: string) => {
  try {
    const q = query(
      collection(db, 'grades'),
      where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GradeRecord));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `grades/${courseId}`);
    return [];
  }
};

export interface ScholarshipConfig {
  id: string;
  monthlyValue: number;
  benefits: string[];
  requirements: string;
  updatedAt: any;
}

export interface StudentScholarship {
  id?: string;
  studentId: string;
  studentName: string;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  enrolledCoursesCount: number;
  startDate?: string;
  notes?: string;
  updatedAt: any;
}

export const getScholarshipConfig = async (): Promise<ScholarshipConfig | null> => {
  try {
    const q = query(collection(db, 'scholarship_config'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ScholarshipConfig;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'scholarship_config');
    return null;
  }
};

export const saveScholarshipConfig = async (data: Omit<ScholarshipConfig, 'id'>) => {
  try {
    const config = await getScholarshipConfig();
    if (config) {
      await updateDoc(doc(db, 'scholarship_config', config.id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, 'scholarship_config'), {
        ...data,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'scholarship_config');
    throw error;
  }
};

export const updateStudentScholarship = async (data: Omit<StudentScholarship, 'id'>) => {
  try {
    const q = query(collection(db, 'student_scholarships'), where('studentId', '==', data.studentId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      await updateDoc(doc(db, 'student_scholarships', snapshot.docs[0].id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, 'student_scholarships'), {
        ...data,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'student_scholarships');
    throw error;
  }
};

export const getStudentScholarships = async (): Promise<StudentScholarship[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'student_scholarships'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentScholarship));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'student_scholarships');
    return [];
  }
};
