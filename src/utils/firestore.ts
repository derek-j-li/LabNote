import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Experiment } from '../types/experiment';

function experimentsCollection(userId: string) {
  return collection(db, 'users', userId, 'experiments');
}

export async function fetchExperiments(userId: string): Promise<Experiment[]> {
  const snapshot = await getDocs(experimentsCollection(userId));
  return snapshot.docs.map((d) => d.data() as Experiment);
}

export async function saveExperiment(userId: string, experiment: Experiment): Promise<void> {
  const docRef = doc(db, 'users', userId, 'experiments', experiment.id);
  await setDoc(docRef, experiment);
}

export async function removeExperiment(userId: string, experimentId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'experiments', experimentId);
  await deleteDoc(docRef);
}
