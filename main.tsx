import * as d3 from "d3";
import * as moment from "moment";
import "react-dom";
import * as React from "react";

declare type ParsedCell<T> = { value: T; representation: string; };

declare type CSVParsedRow = {
  case_id: ParsedCell<number>;
  provincial_case_id: ParsedCell<number>;
  age: ParsedCell<[number, number] | void>;
  sex: ParsedCell<string>;
  health_region: ParsedCell<string>;
  province: ParsedCell<string>;
  country: ParsedCell<string>;
  date_report: ParsedCell<Date>;
  report_week: ParsedCell<Date>;
  travel_yn: ParsedCell<boolean>;
  locally_acquired: ParsedCell<string>;
  case_source: ParsedCell<string>;
};
declare type Datacollection = CSVParsedRow[];

declare type CSVPossibleValues = CSVParsedRow[keyof CSVParsedRow];
declare type CSVColumn = keyof CSVParsedRow;

declare type ExcludeConstraint<T extends CSVColumn> = {
  key: T;
  value: CSVParsedRow[T];
};
const loadingData = d3.csv<CSVParsedRow, CSVColumn>("./cases.csv", row => {
  const {
    case_id,
    provincial_case_id,
    age,
    sex,
    health_region,
    province,
    country,
    date_report,
    report_week,
    travel_yn,
    locally_acquired,
    case_source
  } = row;

  return {
    case_id: {
      value: +case_id,
      representation: case_id
    },
    provincial_case_id: {
      value: +provincial_case_id,
      representation: provincial_case_id
    },
    age: {
      value: (() => {
        const [strMin, strMax] = age.split("-");
        if (strMin.startsWith("<")) return [0, +strMin.slice(1)];

        if (strMin.startsWith(">")) return [+strMin.slice(1), 99];

        if (Number.isNaN(+strMin)) return [-1, -1];

        return [+strMin, +strMax];
      })() as [number, number],
      representation: age
    },
    sex: {
      value: sex,
      representation: sex
    },
    health_region: {
      value: health_region,
      representation: health_region
    },
    province: {
      value: province,
      representation: province
    },
    country: {
      value: country,
      representation: country
    },
    date_report: {
      value: moment(date_report, "DD-MM-YYYY").toDate(),
      representation: date_report
    },
    report_week: {
      value: moment(report_week, "DD-MM-YYYY").toDate(),
      representation: report_week
    },
    travel_yn: {
      value: travel_yn == "1",
      representation: travel_yn == "1" ? "Yes" : "No"
    },
    locally_acquired: {
      value: locally_acquired,
      representation: locally_acquired || "Not Locally Acquired"
    },
    case_source: {
      value: case_source,
      representation: case_source
    }
  };
});

export const Test = (props) => {
  const [data, setData] = React.useState(null);
  const [constraints, setConstraints] = React.useState<ExcludeConstraint<CSVColumn>[]>([]);

  const isConstrainted = (key, value) => constraints.some((c) => c.key == key && c.value == value);

  const removeConstraint = (key, value) => {
    setConstraints([...constraints].filter((c) => c.key != key || c.value != value));
  }
  const addConstraint = (key, value) => {
    setConstraints([...constraints, { key, value }]);
  }

  const toggleConstraint = (key, value) => isConstrainted(key, value) ? removeConstraint(key, value) : addConstraint(key, value);

  if (!data) {
    loadingData.then(data => setData(data));
    return <div>Loading</div>;
  }

  const filterableColumns = data.columns.filter(column =>
    [
      "age",
      "health_region",
      "locally_acquired",
      "province",
      "sex",
      "travel_yn"
    ].includes(column)
  );

  const pairings = filterableColumns.map(
    column =>
      [
        column,
        data
          .map(row => row[column])
          .filter(
            (cell, i, arr) =>
              // TODO: Different lookup strategify for different columns
              // JSON stringify is as computationally expensive as it is mentally cheap
              arr.findIndex(s => JSON.stringify(s) == JSON.stringify(cell)) == i
          )
          .sort((a, b) => {
            switch (column) {
              case "age":
                return a.value[0] - b.value[0];
              default:
                // Default Alphabetic Sorting based on representation
                if (a.value < b.value) {
                  return -1;
                }
                if (a.value > b.value) {
                  return 1;
                }
                return 0;
            }
          })
      ] as [string, CSVPossibleValues[]]
  );

  const filters = Object.fromEntries(pairings);

  const getDataWithConstraints = (
    constraints: ExcludeConstraint<CSVColumn>[]
  ): Datacollection => {
    return data.filter(row => {
      for (let constraint of constraints) {
        if (
          JSON.stringify(row[constraint.key].value) ==
          JSON.stringify(constraint.value)
        )
          return false;
      }

      return true;
    });
  };

  const constrainted = getDataWithConstraints(constraints);
  
  return <div>
    {Object.entries(filters).map(([key, value]) => <><div>
      {key}: {value.map(({value, representation}) => <div><input type="checkbox" onChange={() => toggleConstraint(key, value)} checked={!isConstrainted(key, value)} id={value} />{representation}</div>)}
    </div><hr/></>)}
    <hr/>
    <div style={{ position: "fixed", right: "10px", width: "50%", height: "50vh", top: "10px", overflow: "scroll", backgroundColor: "white", padding: "10px", border: "black solid 1px"}}>
    Number of cases selected: {constrainted.length}
    <hr/>
    {JSON.stringify(constrainted)}
    </div>
  </div>;
};