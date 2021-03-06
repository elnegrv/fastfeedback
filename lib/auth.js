import React, { useState, useEffect, useContext, createContext } from 'react';
import Router from 'next/router';
import Cookies from 'js-cookie';
import { createUser } from './db';
import firebase from './firebase';

const authContext = createContext();

export function AuthProvider({ children }) {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

export const useAuth = () => {
  return useContext(authContext);
};

function useProvideAuth() {
  const [user, setUser] = useState(null);

  const handleUser = (rawUser) => {
    if (rawUser) {
      const user = formatUser(rawUser);
      const { token, ...userWithoutToken } = user;

      createUser(userWithoutToken);
      setUser(user);
      Router.push('/dashboard');

      Cookies.set('fastfeedback-auth', true, {
        expires: 1,
      });

      return user;
    } else {
      setUser(false);
      Router.push('/');
      Cookies.remove('fastfeedback-auth');

      return false;
    }
  };

  const signInWithGithub = () => {
    return firebase
      .auth()
      .signInWithPopup(new firebase.auth.GithubAuthProvider())
      .then((res) => handleUser(res.user));
  };

  const signInWithGoogle = () => {
    return firebase
      .auth()
      .signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then((res) => handleUser(res.user));
  };

  const signout = () => {
    return firebase.auth().signOut().then(handleUser);
  };

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        handleUser(user);
      } else {
        handleUser();
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    signInWithGithub,
    signInWithGoogle,
    signout,
  };
}

const formatUser = (user) => {
  return {
    uid: user.uid,
    email: user.email,
    token: user.ya,
    name: user.displayName,
    provider: user.providerData[0].providerId,
    photoUrl: user.photoURL,
  };
};
