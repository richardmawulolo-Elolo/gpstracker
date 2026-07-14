import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  projectId: "gps-dementia-tracker",
  appId: "1:364657792486:web:9778d83fbdff0ac9617227",
  databaseURL: "https://gps-dementia-tracker-default-rtdb.firebaseio.com",
  storageBucket: "gps-dementia-tracker.firebasestorage.app",
  apiKey: "AIzaSyDMS4zcS4z1yIPJy6J_VanZ_2c7roYMFfs",
  authDomain: "gps-dementia-tracker.firebaseapp.com",
  messagingSenderId: "364657792486",
  measurementId: "G-BHJESBQH5K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);
