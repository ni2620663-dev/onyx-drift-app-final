import React from "react";

const Events = () => {
  const sampleEvents = [
    { id: 1, name: "Music Concert" },
    { id: 2, name: "Art Exhibition" },
    { id: 3, name: "Tech Meetup" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Events</h1>
      <ul className="space-y-4">
        {sampleEvents.map((event) => (
          <li
            key={event.id}
            className="bg-white p-4 rounded shadow hover:bg-gray-50 transition"
          >
            {event.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Events;
