// app/utils/dataLoader.js
import Papa from "papaparse";

export const fetchCapabilities = () => {
  return new Promise((resolve, reject) => {
    fetch("/business-capabilities.csv")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: {
            Score: true,
          },
          complete: (results) => {
            const data = results.data;
            const nestedData = buildNestedCapabilities(data);
            resolve(nestedData);
          },
          error: (err) => {
            reject(err.message || "Error parsing CSV");
          },
        });
      })
      .catch((err) => {
        reject(err.message || "Error fetching CSV");
      });
  });
};

const buildNestedCapabilities = (rows) => {
  const capabilityMap = {};

  rows.forEach((row) => {
    const {
      Level1,
      Level1_ID,
      Level1_Desc,
      Level2,
      Level2_ID,
      Level2_Desc,
      Level3,
      Level3_ID,
      Level3_Desc,
      Level4,
      Level4_ID,
      Level4_Desc,
      Score,
    } = row;

    if (!Level1) return;

    if (!capabilityMap[Level1]) {
      capabilityMap[Level1] = {
        id: Level1_ID || "",
        desc: Level1_Desc || "",
        score: 0,
        children: {},
      };
    }

    const level1 = capabilityMap[Level1];

    if (Level2) {
      if (!level1.children[Level2]) {
        level1.children[Level2] = {
          id: Level2_ID || "",
          desc: Level2_Desc || "",
          score: 0,
          children: {},
        };
      }

      const level2 = level1.children[Level2];

      if (Level3) {
        if (!level2.children[Level3]) {
          level2.children[Level3] = {
            id: Level3_ID || "",
            desc: Level3_Desc || "",
            score: 0,
            children: {},
          };
        }

        const level3 = level2.children[Level3];

        if (Level4) {
          if (!level3.children[Level4]) {
            level3.children[Level4] = {
              id: Level4_ID || "",
              desc: Level4_Desc || "",
              score: Number(Score),
            };
          } else {
            level3.children[Level4].score = Number(Score);
          }
        }
      }
    }
  });

  return capabilityMap;
};
