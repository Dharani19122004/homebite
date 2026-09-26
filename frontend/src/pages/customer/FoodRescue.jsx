import { useState, useEffect } from "react";
import { Loader2, AlertCircle, Inbox, Plus } from "lucide-react";
import {
  getAllFoodRescue,
  takeFoodRescue,
} from "../../services/foodRescueService";
import { getErrorMessage } from "../../utils/apiError";
import FoodRescueCard from "../../components/customer/FoodRescueCard";
import FoodRescueDetails from "../../components/customer/FoodRescueDetails";
import AddFoodRescue from "../../components/customer/AddFoodRescue";
import "./FoodRescue.css";

function FoodRescue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [takingId, setTakingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    setError("");

    getAllFoodRescue()
      .then((res) => setItems(res.data.foodRescues || []))
      .catch((err) =>
        setError(getErrorMessage(err, "Unable to load food rescue items.")),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleTake = async (item) => {
    setActionError("");
    setNotice("");
    setTakingId(item._id);

    try {
      const res = await takeFoodRescue(item._id);
      setNotice(res.data.message);
      setItems((prev) =>
        prev.map((existing) =>
          existing._id === item._id ? res.data.foodRescue : existing,
        ),
      );
    } catch (err) {
      setActionError(getErrorMessage(err, "Unable to rescue this food item."));
    } finally {
      setTakingId(null);
    }
  };

  const selectedItem = items.find((item) => item._id === selectedId) || null;

  const handleCreated = (foodRescue, message) => {
    setItems((prev) => [foodRescue, ...prev]);
    setShowAddForm(false);
    setNotice(message || "Food added successfully!");
  };

  return (
    <div className="food-rescue-page">
      <div className="food-rescue-header-row">
        <div className="catalog-header">
          <h1>Food Rescue</h1>
          <p>
            Share extra food with your community. Rescue surplus food nearby
            before it goes to waste.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary food-rescue-add-btn"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={18} /> Add Food Rescue
        </button>
      </div>

      {notice && <p className="catalog-notice">{notice}</p>}
      {actionError && (
        <p className="catalog-error">
          <AlertCircle size={16} /> {actionError}
        </p>
      )}

      {loading && (
        <p className="catalog-status-text">
          <Loader2 size={18} className="spin" /> Loading food rescue items...
        </p>
      )}

      {!loading && error && (
        <p className="catalog-error">
          <AlertCircle size={16} /> {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="catalog-empty">
          <Inbox size={18} /> No food rescue items are available right now.
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="food-rescue-grid">
          {items.map((item) => (
            <FoodRescueCard
              key={item._id}
              item={item}
              onOpenDetails={(i) => setSelectedId(i._id)}
              onRescue={handleTake}
              rescuing={takingId === item._id}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <FoodRescueDetails
          item={selectedItem}
          onClose={() => setSelectedId(null)}
          onRescue={handleTake}
          rescuing={takingId === selectedItem._id}
        />
      )}

      {showAddForm && (
        <AddFoodRescue
          onClose={() => setShowAddForm(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

export default FoodRescue;
