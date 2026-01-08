export default function Tabs({ active, setActive }) {
    const tabs = ["Editor", "Regex", "Runner"];
  
    return (
      <div className="tabs">
        {tabs.map(tab => (
          <div
            key={tab}
            className={`tab ${active === tab ? "active" : ""}`}
            onClick={() => setActive(tab)}
          >
            {tab}
          </div>
        ))}
      </div>
    );
  }
  