package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os" // <--- Added this missing import
	"time"
)

type Block struct {
	Index     int    `json:"index"`
	Timestamp string `json:"timestamp"`
	TouristID string `json:"tourist_id"`
	DataHash  string `json:"data_hash"`

	Itinerary json.RawMessage `json:"itinerary"`
	Emergency json.RawMessage `json:"emergency"`

	PrevHash string `json:"prev_hash"`
	Hash     string `json:"hash"`
}

var Blockchain []Block

func calculateHash(block Block) string {
	record := fmt.Sprint(block.Index) + block.Timestamp + block.TouristID +
		block.DataHash + string(block.Itinerary) + string(block.Emergency) + block.PrevHash
	h := sha256.Sum256([]byte(record))
	return hex.EncodeToString(h[:])
}

func generateBlock(prev Block, touristID, dataHash string, itinerary, emergency json.RawMessage) Block {
	block := Block{
		Index:     prev.Index + 1,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		TouristID: touristID,
		DataHash:  dataHash,
		Itinerary: itinerary,
		Emergency: emergency,
		PrevHash:  prev.Hash,
	}
	block.Hash = calculateHash(block)
	return block
}

func InitBlockchain() {
	// Try to load from disk first
	file, err := os.ReadFile("blockchain.json")
	if err == nil {
		err = json.Unmarshal(file, &Blockchain)
		// Only return if unmarshal was successful AND we actually got blocks
		if err == nil && len(Blockchain) > 0 {
			fmt.Println("Blockchain loaded from disk.")
			return
		}
	}

	// If file missing, error reading, or empty data -> Start fresh
	fmt.Println("Initializing new blockchain (genesis)...")
	Blockchain = []Block{} // Ensure slice is empty before appending genesis
	genesis := Block{
		Index:     0,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Hash:      "GENESIS",
	}
	Blockchain = append(Blockchain, genesis)
	SaveBlockchain() // Save the genesis block immediately
}

// Call this function whenever you append a new block
func SaveBlockchain() {
	data, err := json.MarshalIndent(Blockchain, "", "  ")
	if err != nil {
		fmt.Println("Error marshalling blockchain:", err)
		return
	}
	err = os.WriteFile("blockchain.json", data, 0644)
	if err != nil {
		fmt.Println("Error saving blockchain to file:", err)
	}
}