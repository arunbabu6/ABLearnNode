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

function AdminUsersPage() {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [clientRequest, setClientRequest] = useState([]);

  const fetchData = async () => {
    const api_url = `${process.env.REACT_APP_API_BASE_URL}api/get-users-details`;
    try {
      const response = await axios.get(api_url);
      setClientRequest(response.data);
      console.log(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
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
        InputProps={{
          className: "rounded-2xl",
        }}
      />
      {loading ? (
        <ClipLoader color="#36D7B7" loading={loading} size={50} />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Picture</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <img
                        src={row.picture}
                        alt="User Avatar"
                        className="rounded-full h-12 w-12"
                      />
                    </TableCell>
                    <TableCell>{row.username}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.role}</TableCell>
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

export default AdminUsersPage;
