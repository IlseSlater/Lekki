import { Theme } from './settings/types';
import { StudioWelcome } from './components/generated/StudioWelcome';

let theme: Theme = 'light';

function App() {
  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  return (
    <>
      <StudioWelcome />
    </>
  ); // %EXPORT_STATEMENT%
}

export default App;
