"use client";
import { addDoc } from "firebase/firestore";

import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { Timestamp } from "firebase/firestore";
import { deleteDoc } from "firebase/firestore";


import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  collection,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { timeStamp } from "console";
import { format } from "path";

type Tweet = {
  id: string;
  uid: string;
  name: string;
  username: string;
  text: string;
  timestamp?: any;
  likes?: string[];
};


export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [tweetText, setTweetText] = useState("");
  const [loadingTweets, setLoadingTweets] = useState(true);
  const deleteTweet = async(tweetId: string) => {
    await deleteDoc(doc(db, "tweets", tweetId));
  };
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
      likes: [],
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
  const toggleLike = async (tweet: Tweet) => {
    if (!user) return;
    const tweetRef = doc(db, "tweets", tweet.id);
    const hasLiked = tweet.likes?.includes(user.uid);
    await updateDoc(tweetRef, {
      likes: hasLiked
      ? arrayRemove(user.uid)
      : arrayUnion(user.uid)

    });
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
      const fetchedTweets: Tweet[] = snapshot.docs.map((doc) => ({

        ...(doc.data() as Omit<Tweet, "id">),
        id: doc.id,
      }));
      setTweets(fetchedTweets);
      setLoadingTweets(false);
  });
  
    return () => unsubscribe();
  }, [user]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  return (
    <main className="min-h-screen bg-black text-white flex justify-center">
      <div className="w-full max-w-xl px-4 py-6">
      {!user ? (
        <div className="min-h screen flex items-center justify-center bg-black">
          <div className="bg-[#0f172a] p-8 rounded-xl w-[350px] text center border border-gray-700 shadow-xlnded-2xl border border-gray-800 bg-black/80 p-8 text-center shadow-xl">

          {/*Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-500">

            </div>
          </div>
          {/*Title*/}
          <h1 className="text-2xl font-bold mb-2">
            Twitter Clone
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            See what's happening in the world right now
          </p>
          {/* Google Sign In */}
          <button
          onClick={signInWithGoogle}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full font-semibold flex items-center justify-center gap-2"
          >
            <img
            src = "https://www.svgrepo.com/show/475656/google-color.svg"
            alt="google"
            className="w-5 h-5"
            />
            Sign In With Google
          </button>
          <p className="text-xs text-gray-500 mt-4">
            By Signing In, You agree to our Terms and Privacy Policy
          </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6 w-full max-w-xl py-6 overflow-y-auto">

          {/* PROFILE */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold">

              {user.displayName?.[0]}
              </div>
            
            <h2 className="mt-2 text-lg font-semibold">
              {user.displayName}
            </h2>

            <p className="text-gray-400 text-sm">
              {user.email}
            </p>
            <button 
            onClick={logout}
            className="mt-3 bg-red-500 hover:bg-red-600 px-4 py-1 rounded text-sm"
            >
              Logout
            </button>
          </div>

          <div className="w-full max-w-md space-y-2">
            <textarea
            value={tweetText}
            onChange={(e) => setTweetText(e.target.value)}
            placeholder="What's happening?"
            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white resize-none"
            />
            <button
            onClick={sendTweet}
            disabled={!tweetText.trim()}

            className={`mt-3 w-full py-2 rounded-full font-semibold
              ${
                tweetText.trim()
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-gray-600 cursor-not-allowed"

              }
            `}

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
              {tweets.map((tweet: Tweet) => (
                <div
                  key={tweet.id}
                  className="border border-gray-700 p-4 rounded-lg bg-[#020617]"
                >
                  <div className="flex-justify-between">
                    <div>
                      <p className="font-semibold">{tweet.name}</p>
                      <p className="text-gray-400 text-sm">@{tweet.username}</p>
                    </div>

                    <p className="text-xs text-gray-500">
                      {formatTime(tweet.timestamp)}
                    </p>
                  </div>

                  <p className="mt-2">{tweet.text}</p>

                  <div className="flex items-counter gap-2 mt-3">
                    <button
                    onClick={() => toggleLike(tweet)}
                    className={`text-sm ${
                      tweet.likes?.includes(user.uid)
                      ? "text-red-500"
                      : "text-gray-400"
                    }`}
                    >
                      Like ❤️
                    </button>
                    <span className="text-xs text-gray-400">
                      {tweet.likes?.length || 0}

                    </span>
                  </div>

                  {user.uid === tweet.uid && (
                    <button
                    onClick={() => deleteTweet(tweet.id)}
                    className="text-red-400 text-sm mt-2 hover:underline"
                    >
                      Delete
                    </button>
                  )}

                </div>
              ))}
            </div>
          )}

        </div>
      )}
      </div>
    </main>
  );
}
