import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MerkAdmin from './merkadmin/merkadmin';
import BeoordelaarAdmin from './beoordelaaradmin/beoordelaaradmin';
import Merk from './merk/merk';
import SpanAdmin from './spanadmin/spanadmin';
import logo from "./logo.svg"

function NavBar(){

  function route(path){
  window.location.href = "/" + path;
  }
  
  return  (
    <div className="navbar">
      <div
        className="nav-item"
        onClick={() => route("vereistes")}
      >
        <img src={logo} alt="Logo" style={{ height: "50px" }} />
      </div>
      <div
        className="nav-item"
        onClick={() => route("merkadmin")}
      >
        Merk Admin
      </div>
      <div
        className="nav-item"
        onClick={() => route("beoordelaaradmin")}
      >
        Beoordelaar Admin
      </div>
      <div
        className="nav-item"
        onClick={() => route("merk")}
      >
        Merk
      </div>
      <div
        className="nav-item"
        onClick={() => route("spanadmin")}
      >
        Span Admin
      </div>
    </div>
  );
}

function Vereistes() {
  return (
    <div>
      <h1>HA1 Vereistes</h1>
      <form>
        <div>
          <label>
            <input type="checkbox" />
            Merk admin bladsy
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" />
            Merk bladsy
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" />
            Span admin bladsy
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" />
            Beoordelaar admin bladsy
          </label>
        </div>
      </form>
    </div>
  );
}

function App() {
  

  return (

    <Router>
      <NavBar></NavBar>
      <div className="main-content">
        <Routes>
            <Route path="/vereistes" element={<Vereistes />} />
            <Route path="/merkadmin" element={<MerkAdmin />} />
            <Route path="/beoordelaaradmin" element={<BeoordelaarAdmin />} />
            <Route path="/merk" element={<Merk />} />
            <Route path="/spanadmin" element={<SpanAdmin />} />
            <Route path="/" element={<Vereistes />} />
            
        </Routes>
      </div>
    </Router>

  );
}

export default App;
