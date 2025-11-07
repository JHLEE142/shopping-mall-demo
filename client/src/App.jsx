import { useState } from 'react';
import './App.css';
import HomeHero from './components/HomeHero';
import SignUpPage from './components/SignUpPage';
import LoginPage from './components/LoginPage';

function App() {
  const [view, setView] = useState('home');
  const [session, setSession] = useState(null);

  const handleLoginSuccess = (data) => {
    setSession({ user: data.user, token: data.token });
    setView('home');
  };

  let content;

  switch (view) {
    case 'signup':
      content = (
        <SignUpPage
          onBack={() => setView('home')}
          onNavigateToLogin={() => setView('login')}
        />
      );
      break;
    case 'login':
      content = (
        <LoginPage
          onBack={() => setView('home')}
          onNavigateToSignup={() => setView('signup')}
          onLoginSuccess={handleLoginSuccess}
        />
      );
      break;
    case 'home':
    default:
      content = (
        <HomeHero
          onMoveToSignUp={() => setView('signup')}
          onMoveToLogin={() => setView('login')}
          user={session?.user || null}
        />
      );
      break;
  }

  return <div className="app">{content}</div>;
}

export default App;
