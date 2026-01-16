export let currentRoom = "global";

export function setRoom(room) {
  currentRoom = room;
  document.getElementById("room-name").textContent = `# ${room}`;
  loadMessages();
}

export function addRoom(room) {
  const li = document.createElement("li");
  li.textContent = room;
  li.onclick = () => setRoom(room);
  document.getElementById("rooms").appendChild(li);
}

export function initRooms() {
  ["global", "general", "random"].forEach(addRoom);
}
