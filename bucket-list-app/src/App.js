import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/api";
import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { listBucketItems } from "./graphql/queries";
import {
  createBucketItem,
  deleteBucketItem,
  updateBucketItem,
} from "./graphql/mutations";

const client = generateClient();

function App() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const data = await client.graphql({
      query: listBucketItems,
      authMode: "userPool",
    });
    setItems(data.data.listBucketItems.items);
  }

  async function addItem() {
    if (!title) return;

    await client.graphql({
      query: createBucketItem,
      variables: {
        input: { title, completed: false },
      },
      authMode: "userPool",
    });

    setTitle("");
    fetchItems();
  }

  async function deleteItem(id) {
    await client.graphql({
      query: deleteBucketItem,
      variables: { input: { id } },
      authMode: "userPool",
    });
    fetchItems();
  }

  async function toggleComplete(item) {
    await client.graphql({
      query: updateBucketItem,
      variables: {
        input: { id: item.id, completed: !item.completed },
      },
      authMode: "userPool",
    });
    fetchItems();
  }

  async function saveEdit(item) {
    await client.graphql({
      query: updateBucketItem,
      variables: {
        input: { id: item.id, title: editingTitle },
      },
      authMode: "userPool",
    });
    setEditingId(null);
    fetchItems();
  }

  const pending = items.filter((i) => !i.completed);
  const completed = items.filter((i) => i.completed);

  const total = items.length;
  const completedCount = completed.length;
  const progress =
    total === 0 ? 0 : Math.round((completedCount / total) * 100);

  const renderItem = (item) => (
    <li
      key={item.id}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px",
        marginBottom: "8px",
        borderRadius: "6px",
        background: "#f9fafb",
        textDecoration: item.completed ? "line-through" : "none",
        opacity: item.completed ? 0.6 : 1,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow =
          "0 6px 14px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="checkbox"
          checked={!!item.completed}
          onChange={() => toggleComplete(item)}
        />

        {editingId === item.id ? (
          <input
            value={editingTitle}
            autoFocus
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={() => saveEdit(item)}
            onKeyDown={(e) => e.key === "Enter" && saveEdit(item)}
          />
        ) : (
          <span
            onClick={() => {
              setEditingId(item.id);
              setEditingTitle(item.title);
            }}
            style={{ cursor: "pointer" }}
          >
            {item.title}
          </span>
        )}
      </div>

      <button
        onClick={() => deleteItem(item.id)}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: "16px",
          opacity: 0.6,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.6)}
      >
        ❌
      </button>
    </li>
  );

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "40px auto",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        background: "#fff",
      }}
    >
      <h2>My Bucket List</h2>

      {/* Input + Add button */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="New item"
          style={{ flex: 1, padding: "8px" }}
        />
        <button onClick={addItem}>Add</button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <>
          <div
            style={{
              height: "8px",
              background: "#e5e7eb",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#2563eb",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>
            {progress}% completed
          </div>
        </>
      )}

      {items.length === 0 && (
        <p style={{ color: "#666" }}>
          No bucket items yet. Add your first goal 🚀
        </p>
      )}

      {pending.length > 0 && (
        <>
          <h4>Pending</h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {pending.map(renderItem)}
          </ul>
        </>
      )}

      {completed.length > 0 && (
        <>
          <h4>Completed</h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {completed.map(renderItem)}
          </ul>
        </>
      )}
    </div>
  );
}

export default withAuthenticator(App);
