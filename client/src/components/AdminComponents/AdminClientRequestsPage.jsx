import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  TablePagination,
} from "@mui/material";
import ClipLoader from "react-spinners/ClipLoader";

function AdminClientRequestsPage() {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [clientRequest, setClientRequest] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const api_url = `${process.env.REACT_APP_API_BASE_URL}api/admin-client-requests`;

    try {
      const response = await axios.get(api_url);
      setClientRequest(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAccept = async (id, email, granterName, grantStatus) => {
    try {
      const userData = {
        id,
        email,
        granterName,
        grantStatus: "accept",
      };
      const api_url = `${process.env.REACT_APP_API_BASE_URL}api/admin-decision`;
      const response = await axios.post(api_url, userData);

      console.log("Response from server: --------", response.data);

      alert("Your grant application has been submitted!");
    } catch (error) {
      console.error("Error making Axios POST request:", error);
    }
    fetchData();
  };

  const handleDecline = async (id, email, granterName, grantStatus) => {
    try {
      const userData = {
        id,
        email,
        granterName,
        grantStatus: "decline",
      };
      const api_url = `${process.env.REACT_APP_API_BASE_URL}api/admin-decision`;
      const response = await axios.post(api_url, userData);

      console.log("Response from server: --------", response.data);

      alert("Your grant application has been submitted!");
    } catch (error) {
      console.error("Error making Axios POST request:", error);
    }
    fetchData();
  };

  const filteredRows = clientRequest.filter((row) =>
    row.username.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <TextField
        label="Filter by name"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        margin="normal"
      />
      {loading ? (
        <ClipLoader color="#36D7B7" loading={loading} size={50} />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount Requested</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row._id}</TableCell>
                    <TableCell>{row.username}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.requestedAmount}</TableCell>
                    <TableCell>
                      {row.grantStatus === "Pending" ? (
                        <>
                          <Button
                            className="mr-2"
                            variant="contained"
                            color="primary"
                            onClick={() =>
                              handleAccept(
                                row._id,
                                row.email,
                                row.granterName,
                                row.grantStatus
                              )
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            className="mr-2"
                            variant="contained"
                            color="error"
                            onClick={() =>
                              handleDecline(
                                row._id,
                                row.email,
                                row.granterName,
                                row.grantStatus
                              )
                            }
                          >
                            Decline
                          </Button>
                        </>
                      ) : (
                        <>
                          {row.grantStatus === "accept" ? (
                            <>
                              <>
                                <Button variant="contained" color="success">
                                  Accepted
                                </Button>
                              </>
                            </>
                          ) : (
                            <>
                              <Button variant="contained" color="error">
                                Declined
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredRows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
}

export default AdminClientRequestsPage;
