import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Rentals from "./pages/Rentals";
import RentalForm from "./pages/RentalForm";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/rentas" element={<Rentals />} />
            <Route path="/renta/nueva" element={<RentalForm />} />
            <Route path="/renta/:id/editar" element={<RentalForm />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
