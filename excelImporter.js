var { useEffect, useMemo, useState } = React;
var { useTable, useSortBy, usePagination } = ReactTable;

const ExcelImporter = () => {
  const [formattedData, setFormattedData] = useState([]);
  const [checkboxValues, setCheckboxValues] = useState({
    A: false,
    B: false,
    C: false,
    D: false,
  });
  const [showTable, setShowTable] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [showSaveBtn, setShowSaveBtn] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      var header = jsonData[0];
      const transformedData = jsonData.slice(1).map((row) => {
        const obj = {};
        header.forEach((headerCell, i) => {
          obj[headerCell] = row[i];
        });
        return obj;
      });
      setFormattedData(transformedData);
      setShowTable(true);
      setSelectedFile(file);
      console.log(jsonData);
    };
    reader.readAsArrayBuffer(file);
  };

  const columns = useMemo(() => {
    if (formattedData.length > 0) {
      return Object.keys(formattedData[0]).map((key) => {
        return {
          Header: key,
          accessor: key,
        };
      });
    }
    return [];
  }, [formattedData]);

  const data = useMemo(() => formattedData, [formattedData]);

  const tableInstance = useTable(
    { columns, data, initialState: { pageIndex: 0 } },
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    pageOptions,
    page,
    state: { pageIndex, pageSize },
    gotoPage,
    previousPage,
    nextPage,
    setPageSize,
    canPreviousPage,
    canNextPage,
  } = tableInstance;

  useEffect(() => {
    tableInstance.setPageSize(pageSize);
  }, [pageSize, tableInstance]);

  const handleSubmit = () => {
    const payload = {
      formattedData,
      checkboxValues,
    };
    setLoading(true);
    // Make Axios POST call here
    axios
      .post(API_VARIABLES.SUBMIT_URL, payload)
      .then((response) => {
        // Handle the response
        setLoading(false);
        setShowSaveBtn(true);
      })
      .catch((error) => {
        // Handle the error
        console.error(error);
        alert("An error occured while processing your request!");
        setLoading(false);
      });
  };

  const handleSave = () => {
    // const payload = {
    //   formattedData,
    //   checkboxValues,
    // };
    setLoading(true);
    // Make Axios POST call here
    axios
      .post(API_VARIABLES.SAVE_URL, {})
      .then((response) => {
        // Handle the response
        setLoading(false);
        setShowSuccess(true);
      })
      .catch((error) => {
        // Handle the error
        console.error(error);
        alert("An error occured while processing your request!");
        setLoading(false);
      });
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setCheckboxValues((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };

  const handleCancel = () => {
    setFormattedData([]);
    setCheckboxValues({
      A: false,
      B: false,
      C: false,
      D: false,
    });
    setShowTable(false);
    setSelectedFile(null);
  };

  return (
    <React.Fragment>
      {!showSuccess && (
        <div className="excel-importer-container">
          {!showTable && (
            <div className="upload-container">
              <input
                type="file"
                accept=".xlsx, .xls"
                id="file-input"
                onChange={handleFileUpload}
              />
              <label htmlFor="file-input" className="file-label">
                {selectedFile ? selectedFile.name : "Choose a file"}
              </label>
            </div>
          )}{" "}
          {showTable && (
            <div>
              <table className="data-table" {...getTableProps()}>
                <thead>
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <th
                          {...column.getHeaderProps(
                            column.getSortByToggleProps()
                          )}
                        >
                          {column.render("Header")}
                          <span>
                            {column.isSorted
                              ? column.isSortedDesc
                                ? " 🔽"
                                : " 🔼"
                              : ""}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                  {page.map((row) => {
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps()}>
                        {row.cells.map((cell) => {
                          return (
                            <td {...cell.getCellProps()}>
                              {cell.render("Cell")}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                >
                  Previous Page
                </button>
                <div>
                  Page{" "}
                  <input
                    className="page-input"
                    type="number"
                    value={pageIndex + 1}
                    min={1}
                    max={pageOptions.length}
                    onChange={(e) => {
                      const page = e.target.value
                        ? Number(e.target.value) - 1
                        : 0;
                      gotoPage(page);
                    }}
                  />
                  <span className="page-total">of {pageOptions.length}</span>
                </div>
                <button
                  className="pagination-btn"
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                >
                  Next Page
                </button>
                <select
                  className="page-size-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                  }}
                >
                  {[5, 10, 20, 50, 100].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      Show {pageSize}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {showTable && (
            <div className="excel-importer-bottom">
              <div className="checkbox-container">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="A"
                    checked={checkboxValues.A}
                    onChange={handleCheckboxChange}
                  />
                  A
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="B"
                    checked={checkboxValues.B}
                    onChange={handleCheckboxChange}
                  />
                  B
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="C"
                    checked={checkboxValues.C}
                    onChange={handleCheckboxChange}
                  />
                  C
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="D"
                    checked={checkboxValues.D}
                    onChange={handleCheckboxChange}
                  />
                  D
                </label>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "20px",
                }}
              >
                {!showSaveBtn && (
                  <button className="submit-button" onClick={handleSubmit}>
                    Submit
                  </button>
                )}
                {showSaveBtn && (
                  <button className="submit-button" onClick={handleSave}>
                    Save
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {showSuccess && (
        <div class="success-container">
          <h1>Success!</h1>
          <p>Your request has been processed successfully.</p>
          <a href="#" class="success-btn" onClick={() => location.reload()}>
            Continue
          </a>
        </div>
      )}
      {isLoading && (
        <div class="loader-container">
          <div class="loader-overlay"></div>
          <div class="loader"></div>
        </div>
      )}
    </React.Fragment>
  );
};
