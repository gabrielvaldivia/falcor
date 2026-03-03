import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";

export async function uploadIllustration(storyId, passageIndex, blob) {
  const path = `stories/${storyId}/passage-${passageIndex}.png`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}
