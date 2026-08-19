const fs = require('fs');
const file = 'src/pages/Settings/RoomManager.jsx';
let content = fs.readFileSync(file, 'utf8');

const goodBlock = \
  // --- ROOM LOGIC ---
  const filteredRooms = useMemo(() => 
    (rooms || []).filter(r => 
      !search || 
      (r.roomNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.ward || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.type || '').toLowerCase().includes(search.toLowerCase())
    ),
  [rooms, search]);

  const handleAddRoom = () => {
    if (!newRoom.roomNo || !newRoom.ward || !newRoom.block || !newRoom.tariff) {
      showToast('Please fill all required fields (Block, Ward, Room No, Tariff)', 'error');
      return;
    }
    
    let generatedRooms = [];
    if (isBulkMode) {
      const count = parseInt(bulkCount) || 10;
      for (let i = 1; i <= count; i++) {
        const charSuffix = String.fromCharCode(64 + i);
        const newId = \\\RM-\\\-\\\\\\;
        generatedRooms.push({
          id: newId,
          block: newRoom.block,
          floor: newRoom.floor,
          ward: newRoom.ward,
          roomNo: newRoom.roomNo,
          bedNo: \\\Bed-\\\\\\,
          type: newRoom.type || roomTypes[0],
          careLevel: newRoom.careLevel,
          gender: 'Mixed',
          price: \\\? \\\ / day\\\,
          tariff: Number(newRoom.tariff),
          equipment: {
            oxygen: newRoom.eqOxygen,
            monitor: newRoom.eqMonitor,
            ventilator: newRoom.eqVentilator,
            cardiac: newRoom.eqCardiac,
            isolation: newRoom.eqIso
          },
          status: 'Available',
          patientId: null, patientName: null, assignedDoctor: null, assignedNurse: null, admissionDate: null, notes: 'Auto-generated bed.'
        });
      }
    } else {
      const newId = \\\RM-\\\\\\;
      generatedRooms.push({
        id: newId,
        block: newRoom.block,
        floor: newRoom.floor,
        ward: newRoom.ward,
        roomNo: newRoom.roomNo,
        bedNo: newRoom.bedNo || 'A',
        type: newRoom.type || roomTypes[0],
        careLevel: newRoom.careLevel,
        gender: 'Mixed',
        price: \\\? \\\ / day\\\,
        tariff: Number(newRoom.tariff),
        equipment: {
          oxygen: newRoom.eqOxygen,
          monitor: newRoom.eqMonitor,
          ventilator: newRoom.eqVentilator,
          cardiac: newRoom.eqCardiac,
          isolation: newRoom.eqIso
        },
        status: 'Available',
        patientId: null, patientName: null, assignedDoctor: null, assignedNurse: null, admissionDate: null, notes: 'Newly added room.'
      });
    }
    
    setRooms(prev => [...generatedRooms, ...prev]);
    showToast(isBulkMode ? \\\Generated \\\ beds in Room \\\\\\ : \\\Room \\\ added to \\\\\\);
    
    setNewRoom(prev => ({
      ...prev, roomNo: '', bedNo: '', eqOxygen: false, eqMonitor: false, eqVentilator: false, eqCardiac: false, eqIso: false
    }));
  };

  const handleDeleteRoom = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (room && room.status === 'Occupied') {
      showToast('Cannot delete an occupied room.', 'error');
      setDeleteConfirm(null);
      return;
    }
    setRooms(rooms.filter(r => r.id !== roomId));
    setDeleteConfirm(null);
    showToast('Room deleted', 'info');
  };
\;

const rx = /\/\/ --- ROOM LOGIC ---[\s\S]*?(?=return \()/;
content = content.replace(rx, goodBlock + '\n  ');
fs.writeFileSync(file, content);

