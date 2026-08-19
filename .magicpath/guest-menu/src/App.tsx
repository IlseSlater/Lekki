import { Theme } from './settings/types';
import { GuestMenu } from './components/generated/GuestMenu';

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
      <GuestMenu />
    </>
  ); // %EXPORT_STATEMENT%
}

export default App;
