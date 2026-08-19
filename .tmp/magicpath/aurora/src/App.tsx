import { Theme } from './settings/types';
import { AuroraAtelier } from './components/generated/AuroraAtelier';

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
      <AuroraAtelier />
    </>
  ); // %EXPORT_STATEMENT%
}

export default App;
