const lessons = [
    {
      id: 1,
      title: "Lesson 1",
      description: "Description of lesson 1.",
      begin: "2025-02-03T08:00:00",
      end: "2025-02-03T10:00:00"
    },
    {
      id: 2,
      title: "Lesson 2",
      description: "Description of lesson 2.",
      begin: "2025-02-03T10:30:00",
      end: "2025-02-03T12:30:00"
    },
    {
      id: 3,
      title: "Lesson 3",
      description: "Description of lesson 3.",
      begin: "2025-02-03T13:30:00",
      end: "2025-02-03T15:30:00"
    },
    {
      id: 4,
      title: "Lesson 4",
      description: "Description of lesson 4.",
      begin: "2025-02-03T16:00:00",
      end: "2025-02-03T18:00:00"
    },
    {
      id: 5,
      title: "Lesson 5",
      description: "Description of lesson 5.",
      begin: "2025-02-04T08:00:00",
      end: "2025-02-04T10:00:00"
    },
    {
      id: 6,
      title: "Lesson 6",
      description: "Description of lesson 6.",
      begin: "2025-02-04T10:30:00",
      end: "2025-02-04T12:30:00"
    },
    {
      id: 7,
      title: "Lesson 7",
      description: "Description of lesson 7.",
      begin: "2025-02-04T13:30:00",
      end: "2025-02-04T15:30:00"
    },
    {
      id: 8,
      title: "Lesson 8",
      description: "Description of lesson 8.",
      begin: "2025-02-04T16:00:00",
      end: "2025-02-04T18:00:00"
    },
    {
      id: 9,
      title: "Lesson 9",
      description: "Description of lesson 9.",
      begin: "2025-02-05T08:00:00",
      end: "2025-02-05T10:00:00"
    },
    {
      id: 10,
      title: "Lesson 10",
      description: "Description of lesson 10.",
      begin: "2025-02-05T10:30:00",
      end: "2025-02-05T12:30:00"
    },
    {
      id: 11,
      title: "Lesson 11",
      description: "Description of lesson 11.",
      begin: "2025-02-05T13:30:00",
      end: "2025-02-05T15:30:00"
    },
    {
      id: 12,
      title: "Lesson 12",
      description: "Description of lesson 12.",
      begin: "2025-02-05T16:00:00",
      end: "2025-02-05T18:00:00"
    },
    {
      id: 13,
      title: "Lesson 13",
      description: "Description of lesson 13.",
      begin: "2025-02-06T08:00:00",
      end: "2025-02-06T10:00:00"
    },
    {
      id: 14,
      title: "Lesson 14",
      description: "Description of lesson 14.",
      begin: "2025-02-06T10:30:00",
      end: "2025-02-06T12:30:00"
    },
    {
      id: 15,
      title: "Lesson 15",
      description: "Description of lesson 15.",
      begin: "2025-02-06T13:30:00",
      end: "2025-02-06T15:30:00"
    },
    {
      id: 16,
      title: "Lesson 16",
      description: "Description of lesson 16.",
      begin: "2025-02-06T16:00:00",
      end: "2025-02-06T18:00:00"
    },
    {
      id: 17,
      title: "Lesson 17",
      description: "Description of lesson 17.",
      begin: "2025-02-07T08:00:00",
      end: "2025-02-07T10:00:00"
    },
    {
      id: 18,
      title: "Lesson 18",
      description: "Description of lesson 18.",
      begin: "2025-02-07T10:30:00",
      end: "2025-02-07T12:30:00"
    },
    {
      id: 19,
      title: "Lesson 19",
      description: "Description of lesson 19.",
      begin: "2025-02-07T13:30:00",
      end: "2025-02-07T15:30:00"
    },
    {
      id: 20,
      title: "Lesson 20",
      description: "Description of lesson 20.",
      begin: "2025-02-07T16:00:00",
      end: "2025-02-07T18:00:00"
    },
    {
      id: 21,
      title: "Lesson 21",
      description: "Description of lesson 21.",
      begin: "2025-02-10T08:00:00",
      end: "2025-02-10T10:00:00"
    },
    {
      id: 22,
      title: "Lesson 22",
      description: "Description of lesson 22.",
      begin: "2025-02-10T10:30:00",
      end: "2025-02-10T12:30:00"
    },
    {
      id: 23,
      title: "Lesson 23",
      description: "Description of lesson 23.",
      begin: "2025-02-10T13:30:00",
      end: "2025-02-10T15:30:00"
    },
    {
      id: 24,
      title: "Lesson 24",
      description: "Description of lesson 24.",
      begin: "2025-02-10T16:00:00",
      end: "2025-02-10T18:00:00"
    },
    {
      id: 25,
      title: "Lesson 25",
      description: "Description of lesson 25.",
      begin: "2025-02-11T08:00:00",
      end: "2025-02-11T10:00:00"
    },
    {
      id: 26,
      title: "Lesson 26",
      description: "Description of lesson 26.",
      begin: "2025-02-11T10:30:00",
      end: "2025-02-11T12:30:00"
    },
    {
      id: 27,
      title: "Lesson 27",
      description: "Description of lesson 27.",
      begin: "2025-02-11T13:30:00",
      end: "2025-02-11T15:30:00"
    },
    {
      id: 28,
      title: "Lesson 28",
      description: "Description of lesson 28.",
      begin: "2025-02-11T16:00:00",
      end: "2025-02-11T18:00:00"
    }
];


window.onload = main;

function addElement() {
  const newListItems = lessons.map((x) => {
    var li = document.createElement("li");
    var title = document.createTextNode(x.title);
    li.appendChild(title);
    return li;
  })
  return newListItems
}
function appendListItems(newListItems) {
  var ul = document.getElementById("lista");
  newListItems.forEach(element => {
    ul.appendChild(element);

  });
}
function main() {
  var oggetto = addElement()
  appendListItems(oggetto);
}