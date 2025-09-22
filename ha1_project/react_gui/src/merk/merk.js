import { useState } from "react";
import { stuurPunte } from "../services/merk_services";

function Merk() {
  const [message, setMessage] = useState("");

  return (
    <div>
        <h1>Welkom by die Merk bladsy.</h1>
        <ul>
        <li>Kies 'n span om te merk</li>
        <li>Voltooi die merkblad</li>
        <li>Dien die voltooide merkblad in</li>
      </ul>
    <button
      onClick={async () => {
        try {
          await stuurPunte({ kriteria1: 80, kriteria2: 90 });
          // Gebruik 'n state om boodskappe te wys in plaas van alerts
          setMessage("Punte suksesvol gestuur!");
        } catch (err) {
          setMessage("Fout met stuur van punte: " + err.message);
        }
      }}
    >
      Stuur Punte
    </button>
    
    {message && <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>{message}</div>}

    </div>
  );
}

export default Merk;
