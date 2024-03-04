import "../style/batiment.css";
import "../style/loader/loader.css";
import { useState, useEffect } from "react";

const Batiment = () => {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [erreur, setErreur] = useState(false);
  const [etageCourant, setEtageCourant] = useState({});
  const [etages, setEtages] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [occupation, setOccupation] = useState({});
  const [pourcentageOccupation, setPourcentageOccupation] = useState({});
  const [activeId, setActiveId] = useState(null);

  const handlePieceClick = (id) => {
    setActiveId(id);
  };
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const repense = await fetch(
          "https://api-developers.spinalcom.com/api/v1/geographicContext/space"
        );
        const batiments = await repense.json();
        const batiment = batiments.children.find(
          (objet) => objet.dynamicId === 19274064
        );
        setEtageCourant(batiment.children[0]);
        setPieces(batiment.children[0].children);
        setEtages(batiment.children);
        setData(batiment);
      } catch (error) {
        console.log(`Error: ${error}`);
        setErreur(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchOccupation = async (PieceDynamicId) => {
    try {
      const repense = await fetch(
        `https://api-developers.spinalcom.com/api/v1/node/${PieceDynamicId}/control_endpoint_list`
      );
      const piece = await repense.json();

      if (piece.length > 0) {
        const endpoint = piece[0].endpoints.find(
          (endpoint) => endpoint.type === "Occupation"
        );

        setOccupation((prevOccupation) => ({
          ...prevOccupation,
          [PieceDynamicId]: endpoint.currentValue,
        }));
      } else {
        setOccupation((prevOccupation) => ({
          ...prevOccupation,
          [PieceDynamicId]: undefined,
        }));
      }
    } catch (e) {
      console.error("c'est indefini pour:", PieceDynamicId);
    }
  };

  useEffect(() => {
    pieces &&
      pieces.map((piece) => {
        setOccupation({});

        fetchOccupation(piece.dynamicId);
      });
    const fetchOccupationPourcentage = async () => {
      const pourcentageObjet = {};
      await Promise.all(
        etages.map(async (etage) => {
          const pourcentage = await calculePourcentage(etage.dynamicId);
          pourcentageObjet[etage.dynamicId] = pourcentage;
        })
      );
      setPourcentageOccupation(pourcentageObjet);
    };

    fetchOccupationPourcentage();
  }, [pieces]);
  //console.log("voila", occupation);
  console.log(occupation);
  //calcule de pourcentage
  const calculePourcentage = async (etageID) => {
    let nombrePieceOccupe = 0;
    //recupere les pieces de l'etage en qst
    const piecesEtage = etages.filter((etage) => etage.dynamicId === etageID);
    //nbr total de chambre par etage
    console.log(piecesEtage[0].dynamicId);

    const fetchRequests = piecesEtage[0].children.map(async (child) => {
      try {
        const repense = await fetch(
          `https://api-developers.spinalcom.com/api/v1/node/${child.dynamicId}/control_endpoint_list`
        );
        const piece = await repense.json();
        if (piece.length > 0) {
          const endpoint = piece[0].endpoints.find(
            (endpoint) => endpoint.type === "Occupation"
          );
          if (endpoint.currentValue == true) {
            nombrePieceOccupe = nombrePieceOccupe + 1;
          }
        }
      } catch (e) {
        console.log(e);
      }
    });
    await Promise.all(fetchRequests);
    const pourcentageOccupation =
      (nombrePieceOccupe / piecesEtage[0].children.length) * 100;

    // Retourner le pourcentage d'occupation arrondi à deux décimales
    return pourcentageOccupation.toFixed(2);
  };

  if (erreur) {
    return (
      <div className="batiment">
        <h1>Erreur de chargement </h1>
      </div>
    );
  }

  return (
    <div className="batiment">
      {/**section 1 */}
      {isLoading ? (
        <div className="spinner"></div>
      ) : (
        <>
          {" "}
          <div className="batiment_container1">
            <div className="batiment_container1_nom">
              <h3>{data && data.name}</h3>
              <p style={{ textTransform: "uppercase", color: "#374151" }}>
                {data && data.type}
              </p>
            </div>
            <div className="batiment_container1_etage">
              <h3>{"étages"}</h3>
              <div className="list_pieces">
                {etages &&
                  etages.map((etage) => (
                    <div
                      key={etage.dynamicId}
                      className={`piece ${
                        activeId === etage.dynamicId ? "active" : ""
                      }`}
                      onClick={() => {
                        handlePieceClick(etage.dynamicId);
                        setEtageCourant(etage);
                        setPieces(etage.children);
                      }}
                    >
                      <h3>{etage.name}</h3>
                      <p>{`${pourcentageOccupation[etage.dynamicId]} %`}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          {/** section 2*/}
          <div className="batiment_container2">
            <div className="batiment_container2_etage_info">
              <div
                className="nom_etage"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3>{data && data.children && etageCourant.name}</h3>
                  <p style={{ textTransform: "uppercase", color: "#374151" }}>
                    {data && data.children && etageCourant.type}
                  </p>
                </div>
                <h3 style={{ color: "rgb(5, 9, 75)" }}>{`${
                  pourcentageOccupation[etageCourant.dynamicId]
                } %`}</h3>
              </div>
              <div className="nombre_piece">
                <h3 style={{ color: "rgb(25, 8, 43)", fontSize: "4rem" }}>
                  {pieces.length}
                </h3>{" "}
                <p>{"Pièces"}</p>
              </div>
            </div>
            <div className="batiment_container2_piece">
              <h3>{"pieces"}</h3>
              <div className="list_pieces">
                {pieces.map((piece) => (
                  <div key={piece.dynamicId} className="piece">
                    <h3>{piece.name}</h3>

                    <p
                      className={
                        occupation && occupation[piece.dynamicId] !== undefined
                          ? occupation[piece.dynamicId]
                            ? "occupé"
                            : "non-occupé"
                          : "undefined"
                      }
                    >
                      {occupation && occupation[piece.dynamicId] !== undefined
                        ? occupation[piece.dynamicId]
                          ? "Occupé"
                          : "Non occupé"
                        : "Undefined"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Batiment;
