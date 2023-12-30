import { Container, Table, Row, Form, Col, Button, ListGroup, Alert, Badge, Tab, Tabs } from 'react-bootstrap';
import { NavLink, useParams } from "react-router-dom";
import React, { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from '../../common/AuthProvider.js';
import ReactJson from '@microlink/react-json-view';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { WithContext as ReactTags } from 'react-tag-input';

function Project() {

  const url = process.env.REACT_APP_RESTAI_API_URL || "";
  const [info, setInfo] = useState({ "version": "", "embeddings": [], "llms": [], "loaders": [] });
  const [data, setData] = useState({ projects: [] });
  const [embeddings, setEmbeddings] = useState({ embeddings: [] });
  const [file, setFile] = useState(null);
  const contentForm = useRef(null)
  const contentNameForm = useRef(null)
  const [embedding, setEmbedding] = useState(null);
  const [uploadResponse, setUploadResponse] = useState({ type: null });
  const [canSubmit, setCanSubmit] = useState(true);
  const [error, setError] = useState([]);
  const urlForm = useRef(null);
  const ref = useRef(null);
  const fileForm = useRef(null);
  var { projectName } = useParams();
  const { getBasicAuth } = useContext(AuthContext);
  const user = getBasicAuth();
  const [tags, setTags] = React.useState([]);
  const typeForm = useRef(null)
  const searchForm = useRef(null)
  const kSearchForm = useRef(null)
  const thresholdSearchForm = useRef(null)

  const Link = ({ id, children, title }) => (
    <OverlayTrigger overlay={<Tooltip id={id}>{title}</Tooltip>}>
      <span style={{ fontSize: "small", margin: "3px" }}>{children}</span>
    </OverlayTrigger>
  );

  const onSubmitSearchHandler = (event) => {
    event.preventDefault();

    var data = {}
    if (typeForm.current.value === "text") {
      data.text = searchForm.current.value
      data.k = kSearchForm.current.value
      data.score = thresholdSearchForm.current.value
    } else if (typeForm.current.value === "source") {
      data.source = searchForm.current.value
    }

    fetch(url + "/projects/" + projectName + "/embeddings/search", {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json', 'Authorization': 'Basic ' + user.basicAuth }),
      body: JSON.stringify(data),
    })
      .then(function (response) {
        if (!response.ok) {
          response.json().then(function (data) {
            setError([...error, { "functionName": "onSubmitHandler", "error": data.detail }]);
          });
          throw Error(response.statusText);
        } else {
          return response.json();
        }
      })
      .then((response) => {
        setEmbeddings(response)
      }).catch(err => {
        setError([...error, { "functionName": "onSubmitHandler", "error": err.toString() }]);
      });

  }

  const handleDeleteProjectClick = (projectName) => {
    if (window.confirm("Delete " + projectName + "?")) {
      fetch(url + "/projects/" + projectName, { method: 'DELETE', headers: new Headers({ 'Authorization': 'Basic ' + user.basicAuth }) })
        .then(function (response) {
          if (!response.ok) {
            response.json().then(function (data) {
              setError([...error, { "functionName": "onSubmitHandler", "error": data.detail }]);
            });
            throw Error(response.statusText);
          } else {
            window.location = "/admin"
          }
        })
        .catch(err => {
          setError([...error, { "functionName": "handleDeleteClick", "error": err.toString() }]);
        });
    }
  }

  const fetchProject = (projectName) => {
    return fetch(url + "/projects/" + projectName, { headers: new Headers({ 'Authorization': 'Basic ' + user.basicAuth }) })
      .then((res) => res.json())
      .then((d) => {
        setData(d)
        if (d.documents < 20000) {
          fetchEmbeddings(projectName);
        }
      }
      ).catch(err => {
        setError([...error, { "functionName": "fetchProject", "error": err.toString() }]);
      });
  }

  const fetchEmbeddings = (projectName) => {
    searchForm.current.value = "";
    setEmbeddings({ "embeddings": [] });
    if (data.documents < 20000 || !data.documents) {
      return fetch(url + "/projects/" + projectName + "/embeddings", { headers: new Headers({ 'Authorization': 'Basic ' + user.basicAuth }) })
        .then((res) => res.json())
        .then((d) => setEmbeddings(d)
        ).catch(err => {
          setError([...error, { "functionName": "fetchEmbeddings", "error": err.toString() }]);
        });
    }
  }

  const handleDeleteClick = (source) => {
    if (window.confirm("Delete " + source + "?")) {
      fetch(url + "/projects/" + projectName + "/embeddings/" + btoa(source),
        {
          method: 'DELETE', headers: new Headers({ 'Authorization': 'Basic ' + user.basicAuth })
        }).then(() => {
          fetchProject(projectName);
          fetchEmbeddings(projectName);
        }).catch(err => {
          setError([...error, { "functionName": "handleDeleteClick", "error": err.toString() }]);
        });
    }
  }

  const handleResetEmbeddingsClick = () => {
    if (window.confirm("Reset " + projectName + " embeddings?")) {
      fetch(url + "/projects/" + projectName + "/embeddings/reset",
        {
          method: 'POST', headers: new Headers({ 'Authorization': 'Basic ' + user.basicAuth })
        }).then(() => {
          fetchProject(projectName);
          fetchEmbeddings(projectName);
        }).catch(err => {
          setError([...error, { "functionName": "handleResetEmbeddingsClick", "error": err.toString() }]);
        });
    }
  }

  const handleViewClick = (source) => {
    fetch(url + "/projects/" + projectName + "/embeddings/source/" + btoa(source), {
      method: 'GET',
      headers: new Headers({ 'Content-Type': 'application/json', 'Authorization': 'Basic ' + user.basicAuth }),
    })
      .then(response => response.json())
      .then(response => {
        response.source = source;
        setEmbedding(response);
        setTimeout(() => {
          ref.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }).catch(err => {
        setError([...error, { "functionName": "handleViewClick", "error": err.toString() }]);
      });
  }

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const resetFileInput = () => {
    // 👇️ reset input value
    setFile(null);
    fileForm.current.value = null;
  };

  const handleDelete = i => {
    setTags(tags.filter((tag, index) => index !== i));
  };

  const handleAddition = tag => {
    setTags([...tags, tag]);
  };


  const onSubmitHandler = (event) => {
    event.preventDefault();
    if (canSubmit) {
      setCanSubmit(false);
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        fetch(url + "/projects/" + projectName + "/embeddings/ingest/upload", {
          method: 'POST',
          headers: new Headers({ 'Authorization': 'Basic ' + user.basicAuth }),
          body: formData,
        })
          .then(function (response) {
            if (!response.ok) {
              response.json().then(function (data) {
                setError([...error, { "functionName": "onSubmitHandler", "error": data.detail }]);
              });
              throw Error(response.statusText);
            } else {
              return response.json();
            }
          })
          .then((response) => {
            resetFileInput();
            setUploadResponse(response);
            fetchProject(projectName);
            fetchEmbeddings(projectName);
            setCanSubmit(true);
          }).catch(err => {
            setError([...error, { "functionName": "onSubmitHandler FILE", "error": err.toString() }]);
            setCanSubmit(true);
          });
      } else if (urlForm.current.value !== "") {
        var ingestUrl = urlForm.current.value;
        var body = {};

        body = {
          "url": ingestUrl
        }

        fetch(url + "/projects/" + projectName + "/embeddings/ingest/url", {
          method: 'POST',
          headers: new Headers({ 'Content-Type': 'application/json', 'Authorization': 'Basic ' + user.basicAuth }),
          body: JSON.stringify(body),
        })
          .then(response => {
            if (response.status === 500) {
              setError([...error, { "functionName": "onSubmitHandler URL", "error": response.statusText }]);
            }
            return response.json();
          })
          .then((response) => {
            urlForm.current.value = "";
            setUploadResponse(response);
            fetchProject(projectName);
            fetchEmbeddings(projectName);
            setCanSubmit(true);
          }).catch(err => {
            setError([...error, { "functionName": "onSubmitHandler URL", "error": err.toString() }]);
            setCanSubmit(true);
          });
      } else if (contentForm.current.value !== "") {
        var body = {
          "text": contentForm.current.value,
          "source": contentNameForm.current.value
        }

        if (tags.length > 0) {
          body.keywords = tags.map((tag) => tag.text);
        }

        fetch(url + "/projects/" + projectName + "/embeddings/ingest/text", {
          method: 'POST',
          headers: new Headers({ 'Content-Type': 'application/json', 'Authorization': 'Basic ' + user.basicAuth }),
          body: JSON.stringify(body),
        })
          .then(response => {
            if (response.status === 500) {
              setError([...error, { "functionName": "onSubmitHandler Text", "error": response.statusText }]);
            }
            return response.json();
          })
          .then((response) => {
            setUploadResponse(response);
            fetchProject(projectName);
            fetchEmbeddings(projectName);
            setCanSubmit(true);
            contentNameForm.current.value = "";
            contentForm.current.value = "";
            setTags([]);
          }).catch(err => {
            setError([...error, { "functionName": "onSubmitHandler URL", "error": err.toString() }]);
            setCanSubmit(true);
          });
      }
    }
  }

  const fetchInfo = () => {
    return fetch(url + "/info", { headers: new Headers({ 'Authorization': 'Basic ' + user.basicAuth }) })
      .then((res) => res.json())
      .then((d) => setInfo(d)
      ).catch(err => {
        setError([...error, { "functionName": "fetchInfo", "error": err.toString() }]);
      });
  }

  const checkPrivacy = () => {
    var embbeddingPrivacy = true;
    info.embeddings.forEach(function (element) {
      if (element.name === data.embeddings && element.privacy === "public")
        embbeddingPrivacy = false;
    })
    if (embbeddingPrivacy && data.llm_privacy === "private") {
      return true;
    } else {
      return false;
    }
  }

  useEffect(() => {
    document.title = 'RestAI Project ' + projectName;
    fetchProject(projectName);
    fetchInfo();
  }, [projectName]);

  return (
    <>
      {error.length > 0 &&
        <Alert variant="danger">
          {JSON.stringify(error)}
        </Alert>
      }
      {data.llm_type === "vision" ?
        <Container style={{ marginTop: "20px" }}>
          <Row style={{ marginTop: "20px" }}>
            <Col sm={6}>
              <h1>Details {data.name}</h1>
              <ListGroup>
                <ListGroup.Item><b>LLM:</b> {data.llm}</ListGroup.Item>
                <ListGroup.Item><b>Vectorstore:</b> {data.vectorstore}</ListGroup.Item>
              </ListGroup>
            </Col>
            <Col sm={6}>
              <h1>Actions</h1>
              <NavLink
                to={"/projects/" + data.name + "/edit"}
              >
                <Button variant="dark">Edit</Button>{' '}
              </NavLink>
              < NavLink
                to={"/projects/" + data.name + "/vision"}
              >
                <Button variant="dark">Vision</Button>{' '}
              </NavLink>
              <Button onClick={() => handleDeleteProjectClick(data.name)} variant="danger">Delete</Button>
            </Col>
          </Row>
        </Container>
        :
        <Container style={{ marginTop: "20px" }}>
          <Row style={{ marginTop: "20px" }}>
            <Col sm={6}>
              <h1>Details {data.name}</h1>
              <ListGroup>
                <ListGroup.Item><b>Privacy: </b>
                  {checkPrivacy() ?
                    <Badge bg="success">Local AI <Link title="You are NOT SHARING any data with external entities.">ℹ️</Link></Badge>
                    :
                    <Badge bg="danger">Public AI <Link title="You ARE SHARING data with external entities.">ℹ️</Link></Badge>
                  }
                </ListGroup.Item>
                <ListGroup.Item><b>LLM:</b> {data.llm}</ListGroup.Item>
                <ListGroup.Item><b>Vectorstore:</b> {data.vectorstore}</ListGroup.Item>
                <ListGroup.Item><b>Embeddings:</b> {data.embeddings} <Button onClick={() => handleResetEmbeddingsClick()} variant="danger">Reset</Button></ListGroup.Item>
                <ListGroup.Item><b>Documents:</b> {data.documents}</ListGroup.Item>
                <ListGroup.Item><b>Metadatas:</b> {data.metadatas}</ListGroup.Item>
                <ListGroup.Item><b>System:</b> {data.system}</ListGroup.Item>
                <ListGroup.Item><b>K:</b> {data.k}</ListGroup.Item>
                <ListGroup.Item><b>Score:</b> {data.score}</ListGroup.Item>
                <ListGroup.Item><b>Sandboxed:</b> {data.sandboxed ? (<span>✅</span>) : (<span>❌</span>)}</ListGroup.Item>
                <ListGroup.Item><b>Sandbox Project:</b> {data.sandbox_project}</ListGroup.Item>
                <ListGroup.Item><b>Sandbox Message:</b> {data.censorship}</ListGroup.Item>
              </ListGroup>
            </Col>
            <Col sm={6}>
              <h1>Ingest<Link title="Ingest a file or an URL">ℹ️</Link></h1>
              <Form onSubmit={onSubmitHandler}>

                <Tabs
                  defaultActiveKey="file"
                  id="ingestTabs"
                >
                  <Tab eventKey="file" title="File">
                    <Form.Group as={Row} className="mb-3" controlId="formHorizontalEmail">
                      <Col sm={12}>
                        <Form.Control ref={fileForm} onChange={handleFileChange} type="file" />
                      </Col>
                    </Form.Group>
                  </Tab>
                  <Tab eventKey="url" title="URL">
                    <Form.Group as={Row} className="mb-3" controlId="formHorizontalEmail">
                      <Col sm={12}>
                        <Form.Control ref={urlForm} type="url" placeholder="Enter url" />
                      </Col>
                    </Form.Group>
                  </Tab>
                  <Tab eventKey="text" title="Text">
                    <Form.Group as={Col} controlId="formGridSystem">
                      <Form.Label>Name</Form.Label>
                      <Form.Control ref={contentNameForm} />
                      <Form.Label>Keywords<Link title="Optional, if not provided system will automatically calculate them.">ℹ️</Link></Form.Label>
                      <ReactTags
                        tags={tags}
                        suggestions={[]}
                        delimiters={[188, 13]}
                        handleDelete={handleDelete}
                        handleAddition={handleAddition}
                        handleDrag={function () { }}
                        handleTagClick={function () { }}
                        inputFieldPosition="bottom"
                        autocomplete
                      />
                      <Form.Label>Content<Link title="Instructions for the LLM know how to behave">ℹ️</Link></Form.Label>
                      <Form.Control rows="4" as="textarea" ref={contentForm} defaultValue={""} />
                    </Form.Group>
                  </Tab>
                </Tabs>
                <Col sm={2}>
                  <Button variant="dark" type="submit">Ingest</Button>
                </Col>
              </Form>
              {
                (
                  uploadResponse.source &&
                  <Row>
                    <Col sm={12}>
                      <h5>Ingest Result:</h5>
                      <ListGroup>
                        <ListGroup.Item>Source: {uploadResponse.source}</ListGroup.Item>
                        <ListGroup.Item>Documents: {uploadResponse.documents}</ListGroup.Item>
                      </ListGroup>
                    </Col>
                  </Row>
                )
              }
              <hr />
              <h1>Actions</h1>
              <NavLink
                to={"/projects/" + data.name + "/edit"}
              >
                <Button variant="dark">Edit</Button>{' '}
              </NavLink>
              <NavLink
                to={"/projects/" + data.name + "/chat"}
              >
                <Button variant="dark">Chat<Link title="Models need to support Chat mode, unstable otherwise. GPT's and models with 'chat' in the name support it. Example: OpenAI GPT4, LLama based Chat models.">⚠️</Link></Button>{' '}
              </NavLink>
              <NavLink
                to={"/projects/" + data.name + "/question"}
              >
                <Button variant="dark">Question</Button>{' '}
              </NavLink>
              <Button onClick={() => handleDeleteProjectClick(data.name)} variant="danger">Delete</Button>
            </Col>
          </Row>
          <hr />
          <Row style={{ marginTop: "20px" }}>
            <h1>Embeddings<Link title="Ingested files and URLs">ℹ️</Link></h1>
            <Row style={{ marginTop: "20px" }}>
              <h3>Search</h3>
              <Form onSubmit={onSubmitSearchHandler}>
                <Col sm={12}>
                  <Row sm={12}>
                    <Col sm={2}>
                      <Form.Label>Type</Form.Label>
                      <Form.Select ref={typeForm}>
                        <option value="text">Text</option>
                        <option value="source">Source</option>
                      </Form.Select>
                    </Col>
                    <Col sm={2}>
                      <Form.Label>K</Form.Label>
                      <Form.Control ref={kSearchForm} defaultValue={data.k} />
                    </Col>
                    <Col sm={2}>
                      <Form.Label>Threshold</Form.Label>
                      <Form.Control ref={thresholdSearchForm} defaultValue={data.score} />
                    </Col>
                  </Row>
                  <Row sm={12}>
                    <Col sm={10}>
                      <Form.Control
                        ref={searchForm}
                      />
                    </Col>
                    <Col sm={1}>
                      <Button variant="success" type="submit">Search</Button>
                    </Col>
                    <Col sm={1}>
                      <Button variant="danger" onClick={() => fetchEmbeddings(data.name)}>Clear</Button>
                    </Col>
                  </Row>
                </Col>
              </Form>
            </Row>
            <Row style={{ marginTop: "20px" }}>
              <h3>List</h3>
              {data.documents > 20000 && embeddings.embeddings.length === 0 ?
                <Col sm={12}>
                  Too many embeddings to be listed, use the search box
                </Col>
                : (
                  <Col sm={12} style={embeddings.embeddings.length > 5 ? { height: "400px", overflowY: "scroll" } : {}}>
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>ID</th>
                          <th>Source</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          embeddings.embeddings.map((emb, index) => {
                            return (
                              <tr key={index}>
                                <td>{index}</td>
                                <td>
                                  {emb.id}
                                </td>
                                <td>
                                  {emb.source}
                                </td>
                                <td>
                                  <Button onClick={() => handleViewClick(emb.source)} variant="dark">View</Button>{' '}
                                  <Button onClick={() => handleDeleteClick(emb.source)} variant="danger">Delete</Button>
                                </td>
                              </tr>
                            )
                          })
                        }
                      </tbody>
                    </Table>
                  </Col>
                )}
              {
                embedding && (
                  <Row>
                    <Col sm={12}>
                      <h2 ref={ref}>Details ({embedding.source}):</h2>
                      <ListGroup style={{ height: "400px", overflowY: "scroll" }}>
                        <ListGroup.Item><b>IDS:</b> <ReactJson src={embedding.ids} enableClipboard={false} collapsed={0} /></ListGroup.Item>
                        <ListGroup.Item><b>Metadatas:</b> <ReactJson src={embedding.metadatas} enableClipboard={false} /></ListGroup.Item>
                        <ListGroup.Item><b>Documents:</b> <ReactJson src={embedding.documents} enableClipboard={false} /></ListGroup.Item>
                      </ListGroup>
                    </Col>
                  </Row>
                )
              }
            </Row>
          </Row>
        </Container >
      }
    </>
  );
}

export default Project;