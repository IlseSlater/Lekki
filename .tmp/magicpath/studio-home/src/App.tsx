import { Theme } from './settings/types';
import { LEOSStudioHome } from './components/generated/LEOSStudioHome';

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
      <LEOSStudioHome />
    </>);
  // %EXPORT_STATEMENT%
}

export default App;