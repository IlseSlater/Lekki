import { Theme } from './settings/types';
import { LEOSGuestEntry } from './components/generated/LEOSGuestEntry';

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
      <LEOSGuestEntry />
    </>
  ); // %EXPORT_STATEMENT%
}

export default App;
