import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

// Styled Components
const Container = styled.div`
    padding: 20px;
    font-family: Arial, sans-serif;
`;

const Title = styled.h1`
    color: #333;
    text-align: center;
`;

const ErrorMessage = styled.p`
    color: red;
    text-align: center;
`;

const List = styled.ul`
    list-style-type: none;
    padding: 0;
`;

const ListItem = styled.li`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin: 5px 0;
    background-color: #f9f9f9;
    transition: background-color 0.3s;

    &:hover {
        background-color: #e0e0e0;
    }
`;

const Button = styled.button`
    padding: 5px 10px;
    border: none;
    border-radius: 5px;
    background-color: #007bff;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
        background-color: #0056b3;
    }
`;

const DataContainer = styled.div`
    margin-top: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 15px;
    background-color: #fff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const DataTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.th`
    background-color: #007bff;
    color: white;
    font-weight: bold;
    padding: 15px;
    text-align: left;
`;

const TableCell = styled.td`
    border: 1px solid #ddd;
    padding: 10px;
    font-size: 14px;
`;

const ResponsiveTableItem = styled(ListItem)`
    @media (max-width: 600px) {
        flex-direction: column;
        align-items: flex-start;
    }
`;

const TableList = () => {
    const [tables, setTables] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await axios.get('http://localhost:5000/tables');
                setTables(response.data);
            } catch (err) {
                setError('Error fetching tables');
            }
        };

        fetchTables();
    }, []);

    const handleTableClick = async (tableName) => {
        try {
            const response = await axios.get(`http://localhost:5000/tables/${tableName}`);
            setTableData(response.data);
        } catch (err) {
            setError('Error fetching table data');
        }
    };

    return (
        <Container>
            <Title>Response Tables</Title>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <List>
                {tables.map((table, index) => (
                    <ResponsiveTableItem key={index}>
                        <span>{table.table_name}</span>
                        <Button onClick={() => handleTableClick(table.table_name)}>
                            See Responses
                        </Button>
                    </ResponsiveTableItem>
                ))}
            </List>
            {tableData.length > 0 && (
                <DataContainer>
                    <h2>Data from {tableData[0].table_name}</h2>
                    <DataTable>
                        <thead>
                            <tr>
                                {Object.keys(tableData[0]).map((key) => (
                                    <TableHeader key={key}>{key}</TableHeader>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row, index) => (
                                <tr key={index}>
                                    {Object.values(row).map((value, idx) => (
                                        <TableCell key={idx}>{value}</TableCell>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </DataTable>
                </DataContainer>
            )}
        </Container>
    );
};

export default TableList;