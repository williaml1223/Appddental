import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  getDoc, 
  getDocs, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  type DocumentData,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Patient, MedicalDocument, ClinicalRecord, DocumentType, Odontogram, Budget, Appointment } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const medicalService = {
  // --- Patients ---
  async getPatients(): Promise<Patient[]> {
    const path = 'patients';
    try {
      if (!auth.currentUser) return [];
      const q = query(collection(db, path), where('dentistId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  watchPatients(callback: (patients: Patient[]) => void) {
    const path = 'patients';
    if (!auth.currentUser) return () => {};
    
    const q = query(
      collection(db, path), 
      where('dentistId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
      callback(patients);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  async getPatient(id: string): Promise<Patient | null> {
    const path = 'patients';
    try {
      const docRef = doc(db, path, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Patient;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async deletePatient(id: string) {
    const path = 'patients';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'dentistId'>) {
    const path = 'patients';
    try {
      if (!auth.currentUser) throw new Error('No auth user');
      const docRef = await addDoc(collection(db, path), {
        ...patientData,
        dentistId: auth.currentUser.uid,
        createdAt: Date.now()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // --- Records ---
  async getClinicalRecords(patientId: string): Promise<ClinicalRecord[]> {
    const path = `patients/${patientId}/records`;
    try {
      const q = query(collection(db, path), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClinicalRecord));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // --- Documents ---
  async addDocument(patientId: string, docData: Omit<MedicalDocument, 'id' | 'createdAt' | 'patientId'>) {
    const path = `patients/${patientId}/documents`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...docData,
        patientId,
        createdAt: Date.now()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  watchDocuments(patientId: string, callback: (docs: MedicalDocument[]) => void) {
    const path = `patients/${patientId}/documents`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalDocument));
      callback(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  // --- Odontogram ---
  async saveOdontogram(patientId: string, odoData: Omit<Odontogram, 'id' | 'dentistId' | 'updatedAt'>) {
    const path = `patients/${patientId}/odontograms`;
    try {
      if (!auth.currentUser) throw new Error('No auth user');
      const docRef = await addDoc(collection(db, path), {
        ...odoData,
        dentistId: auth.currentUser.uid,
        updatedAt: Date.now()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async getLatestOdontogram(patientId: string): Promise<Odontogram | null> {
    const path = `patients/${patientId}/odontograms`;
    try {
      const q = query(collection(db, path), orderBy('updatedAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Odontogram;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // --- Budgets ---
  async saveBudget(patientId: string, budgetData: Omit<Budget, 'id' | 'dentistId' | 'createdAt'>) {
    const path = `patients/${patientId}/budgets`;
    try {
      if (!auth.currentUser) throw new Error('No auth user');
      const docRef = await addDoc(collection(db, path), {
        ...budgetData,
        dentistId: auth.currentUser.uid,
        createdAt: Date.now()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async getBudgets(patientId: string): Promise<Budget[]> {
    const path = `patients/${patientId}/budgets`;
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async updateBudget(patientId: string, budgetId: string, updates: Partial<Budget>) {
    const path = `patients/${patientId}/budgets/${budgetId}`;
    try {
      await setDoc(doc(db, `patients/${patientId}/budgets`, budgetId), updates, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // --- Appointments ---
  async getAppointments(patientId: string): Promise<Appointment[]> {
    const path = `patients/${patientId}/appointments`;
    try {
      const q = query(collection(db, path), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }
};
