import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Passport from './pages/Passport';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="passport/:id" element={<Passport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
