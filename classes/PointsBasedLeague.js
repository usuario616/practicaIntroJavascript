import League from './League.js'
import { LOCAL_TEAM, AWAY_TEAM } from './League.js'

export default class PointsBasedLeague extends League {
    constructor(name, teams=[], config={}) {
        super(name, teams, config)
    }

    setup(config) {
        const defaultConfig = {
            rounds: 1,
            pointsPerWin: 3,
            pointsPerDraw: 1,
            pointsPerLose: 0
        }
        this.config = Object.assign(defaultConfig, config)
    }

    customizeTeam(teamName) {
        const customizedTeam = super.customizeTeam(teamName)
        return {
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            winsTo:[], //Aquí se almacenan los equipos a los que va ganando.
            miniOrder: 0,
            ...customizedTeam
        }
    }

    generateGoals() {
        return Math.round(Math.random() * 10)
    }

    play(match) {
        const homeGoals = this.generateGoals()
        const awayGoals = this.generateGoals()
        return {
            homeTeam: match[LOCAL_TEAM],
            homeGoals,
            awayTeam: match[AWAY_TEAM],
            awayGoals
        }
    }

    getTeamForName(name) {
        return this.teams.find(team => team.name == name)
    }

    updateTeams(result) {
        // buscar el equipo por su nombre en el array de equipos
        const homeTeam = this.getTeamForName(result.homeTeam)
        const awayTeam = this.getTeamForName(result.awayTeam)
        if (homeTeam && awayTeam) { // si ecuentra ambos equipos

            homeTeam.goalsFor += result.homeGoals
            homeTeam.goalsAgainst += result.awayGoals
            awayTeam.goalsFor += result.awayGoals
            awayTeam.goalsAgainst += result.homeGoals

            if (result.homeGoals > result.awayGoals) { // gana equipo local
                homeTeam.points += this.config.pointsPerWin
                homeTeam.matchesWon += 1
                awayTeam.points += this.config.pointsPerLose
                awayTeam.matchesLost += 1
                homeTeam.winsTo.push(awayTeam.name)
            } else if (result.homeGoals < result.awayGoals) { // gana equipo visitante
                homeTeam.points += this.config.pointsPerLose
                homeTeam.matchesLost += 1
                awayTeam.points += this.config.pointsPerWin
                awayTeam.matchesWon += 1
                awayTeam.winsTo.push(homeTeam.name)
            } else { // empate
                homeTeam.points += this.config.pointsPerDraw
                homeTeam.matchesDrawn += 1
                awayTeam.points += this.config.pointsPerDraw
                awayTeam.matchesDrawn += 1
            }
        }
    }

    displayMatches(){
        let i = 1
            this.matchDaySchedule.forEach(matchDay => {
                console.log(`JORNADA ${i}`)
                matchDay.forEach(match => {
                    if(match[0] && match[1])
                        console.log(`${match[0]} vs ${match[1]}`);
                    else
                        console.log(`-->${match[0] ? match[0] : match[1]} descansa`);
                })
                i++
            })
    }

    displayTotals(){
        const totalGoals = this.teams.reduce(function(goalsAccumulated, team) {
            return goalsAccumulated + team.goalsFor
         }, 0)

         const initialAccumulator = { totalGoals: 0, totalPoints: 0 }
         const totals = this.teams.reduce(function(accumulator, team) {
             accumulator.totalGoals += team.goalsFor
             accumulator.totalPoints += team.points
             return accumulator
         }, initialAccumulator)

         console.log(`TOTALES para el grupo ${this.name} - Total de goles: ${totals.totalGoals} - Total de puntos: ${totals.totalPoints}`)
    }

    setMiniLeagueOrders(){

        // Ver que equipos han empatado en puntos
        const miniLigaAux = [];
        const miniLiga = [];
        let puntos =[];

        this.teams.sort(function(teamA, teamB) {
            if (teamA.points === teamB.points) {
                miniLigaAux.push(teamA, teamB);
                puntos.push(teamA.points); // Recoge las puntuaciones con las que empatan.
                return 0;
            }
        });

        // Preparar miniliga entre los equipos empatados.
        puntos=new Set(puntos); // Elimina valores duplicados.

        let i=0;
        puntos.forEach( puntuacion => { // Para cada puntuación, se recogen los equipos que la tienen.
            miniLiga[i] = { puntuacion, equipos: [] } ;
            miniLigaAux.filter( team => team.points == puntuacion).forEach( teamMini => {
                teamMini.miniOrder=0;
                if(!miniLiga[i].equipos.includes( teamMini )){
                    miniLiga[i].equipos.push( teamMini );
                }
            });
            i++;
        });
        
        // En la miniliga se cuentan los partidos ganados entre ellos.
        miniLiga.forEach( resultado => {
            let nombres =[];
            resultado.equipos.forEach( result => {
                result.miniOrder=0;
                if(!nombres.includes(result.name)){
                    nombres.push(result.name);
                }
            });

            resultado.equipos.forEach( equipo => {
                equipo.winsTo.forEach( item => {
                    equipo.miniOrder += nombres.includes(item) ? 1 : 0;
                });
            });
        });
    }
    
    getStandings() {
        
        //"Mini liga" para obtener orden para los empates
        this.setMiniLeagueOrders();

        // Y a ordenar se ha dicho.
        this.teams.sort(function(teamA, teamB) {
            if (teamA.points > teamB.points) {
                return -1;
            } else if (teamA.points < teamB.points) {
                return 1;
            } else { // Empatan a puntos.
                if(teamA.miniOrder > teamB.miniOrder){
                //if(teamA.winsTo.find( team => team == teamB.name))
                    return -1;
                }else if(teamA.miniOrder < teamB.miniOrder){
                //}else if(teamB.winsTo.find( team => team == teamA.name))
                    return 1;
                }else{ // Tienen la misma puntuación en la "mini liga".
                    const goalsDiffA = teamA.goalsFor - teamA.goalsAgainst;
                    const goalsDiffB = teamB.goalsFor - teamB.goalsAgainst;
                    if (goalsDiffA > goalsDiffB) {
                        return -1;
                    } else if (goalsDiffA < goalsDiffB) {
                        return 1;
                    } else { // También empatan en diferencia de goles.
                        return teamA.name.localeCompare(teamB.name);  
                    }
                }
            }
        })
    }

    displayResults(numJornada){
                // Muestra resultados para el número de jornada recibido.
                const summary = this.summaries[numJornada];
                console.log(`\nGrupo ${this.name} Jornada ${numJornada+1}\n----------------------`)
                summary.results.forEach(result => {
                    if(result.homeTeam && result.awayTeam)
                        console.log(`${result.homeTeam} ${result.homeGoals} - ${result.awayGoals} ${result.awayTeam}`)
                })
                console.table(summary.standings.map(team => {
                    return {
                        Equipo: team.name,
                        Puntos: team.points,
                        Ganados: team.matchesWon,
                        MiniLiga: team.miniOrder,
                        GolesAFavor: team.goalsFor,
                        GolesEnContra: team.goalsAgainst,
                        Diferencia: team.goalsFor - team.goalsAgainst
                    }
                }))
                
    }

}
