import { AppProvider } from "./src/context/AppContext";
import { AppNavigator } from "./src/routes/AppNavigator";

function AppContent() {
  return <AppNavigator />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
