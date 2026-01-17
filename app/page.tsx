"use client";
import { addDoc } from "firebase/firestore";

import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";

import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [tweetText, setTweetText] = useState("");
  const [loadingTweets, setLoadingTweets] = useState(true);
  const sendTweet = async () => {
    if (!user) return;
    if (!tweetText.trim()) return;

    await addDoc(collection(db, "tweets"), {
      text: tweetText,
      uid: user.uid,
      name: user.displayName,
      username: user.email.split("@")[0],
      photoURL: user.photoURL,
      timestamp: serverTimestamp(),
    });
    setTweetText("");
  };
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  // 🔹 Auth listener + save user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            name: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Tweets listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "tweets"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTweets(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
      setLoadingTweets(false);
    },
  (error) => {
    console.error("Tweets Listener error:", error);
  
  }
);

    return () => unsubscribe();
  }, [user]);

  return (
    <main className="flex min-h-screen bg-black text-white justify-center">
      {!user ? (
        <button
          onClick={signInWithGoogle}
          className="rounded bg-blue-500 px-6 py-2 font-bold"
        >
          Sign in with Google
        </button>
      ) : (
        <div className="flex flex-col items-center space-y-6 w-full max-w-xl py-6 overflow-y-auto">

          {/* PROFILE */}
          <div className="text-center space-y-4">
            <img
              src={user.photoURL}
              alt="profile"
              className="mx-auto rounded-full w-20 h-20"
            />
            <h2 className="text-xl font-bold">{user.displayName}</h2>
            <p className="text-sm text-gray-400">{user.email}</p>

            <button
              onClick={logout}
              className="rounded bg-red-500 px-6 py-2 font-bold"
            >
              Logout
            </button>
          </div>

          <div className="w-full max-w-md space-y-2">
            <textarea
            value={tweetText}
            onChange={(e) => setTweetText(e.target.value)}
            placeholder="What's happening?"
            className="w-full rounded bg-gray-900 border border-gray-700 p-3 text-white"
            rows={3}
            />
            <button
            onClick={sendTweet}
            className="bg-blue-500 px-4 py-2 rounded font-bold w-full"
            >
              Tweet
            </button>
          </div>
          {/* TWEETS */}
          <p className="text-gray-400 text-sm">
            Tweets count: {tweets.length}
          </p>
          {loadingTweets && (
            <p className="text-gray-500">Loading tweets...</p>
          )}
          {!loadingTweets && tweets.length===0 && (
            <p className="text-gray-500">No tweets yet. Be the first!! :)</p>
          )}
          {tweets.length > 0 && (
            <div className="w-full max-w-md space-y-4">
              {tweets.map((tweet) => (
                <div
                  key={tweet.id}
                  className="border border-gray-700 p-4 rounded-lg"
                >
                  <p className="font-bold">{tweet.name}</p>
                  <p className="text-gray-400 text-sm">
                    @{tweet.username}
                  </p>
                  <p className="mt-2">{tweet.text}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </main>
  );
}
