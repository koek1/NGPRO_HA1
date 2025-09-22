
import { useState, useEffect } from "react";

function BeoordelaarAdmin() {

  const [punte, setPunte] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:4000/stream");
  
    eventSource.onmessage = (event) => {
      const nuwePunte = JSON.parse(event.data);
      console.log(nuwePunte)
      setPunte((prev) => [...prev, nuwePunte]);
    };
  
    return () => eventSource.close();
  }, []);

  return (
    <div>
        <h1>Welkom by die Beoordelaar Admin bladsy.</h1>
        <ul>
        <li>Kies die kriteria vir 'n rondte</li>
        <li>Sien die punte soos dit tans staan</li>
        <li>Sluit 'n rondte</li>
        <li>Vertoon die wenspan</li>
      </ul>
      <div>
      {punte.map((p, i) => (
        <div key={i}>Kriteria1 {p.kriteria1} | Kriteria2 {p.kriteria2}</div>
      ))}
      </div>
    </div>
    
  );
}

export default BeoordelaarAdmin;
