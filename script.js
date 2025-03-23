console.log('Lets write JavaScript')

let currentSong = null; // Keep track of the currently playing audio
let songs;
let currFolder;

function secondsToMinutes(seconds) {
    // Round down the seconds to remove milliseconds
    seconds = Math.floor(seconds);
    
    // Calculate minutes and remaining seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    // Pad minutes and seconds with leading zeros if needed
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');

    // Return the formatted time
    return `${paddedMinutes}:${paddedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder
    let response = await fetch(`/${folder}/`)
    let text = await response.text()
    let div = document.createElement("div")
    div.innerHTML = text
    let as = div.getElementsByTagName("a")
    let songs = []
    for (let element of as) {
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }
    return songs
}

const playMusic = (track, autoplay = false) => {
    // Pause the currently playing audio if there is one
    if (currentSong) {
        currentSong.pause()
        currentSong.currentTime = 0 // Reset the audio to the start
    }

    // Create a new audio object for the new track
    currentSong = new Audio(`/${currFolder}/` + encodeURIComponent(track))
    if (autoplay) {
        currentSong.play()
        play.src = "pause.svg"
    }

    // Update the displayed track information
    let songName = decodeURIComponent(track.replace(".mp3", "").split(" - ")[0])
    document.querySelector(".songinfo").innerHTML = songName

    // Set initial time display
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    // Update the seekbar as the audio plays
    currentSong.addEventListener('timeupdate', updateSeekBar)

    // Listen for loadedmetadata event to update duration
    currentSong.addEventListener("loadedmetadata", () => {
        document.querySelector(".songtime").innerHTML = 
            `00:00 / ${secondsToMinutes(currentSong.duration)}`;
    });

    // Listen for time update event
    currentSong.addEventListener("timeupdate", () => {
        console.log(currentSong.currentTime, currentSong.duration);
        document.querySelector(".songtime").innerHTML = 
        `${secondsToMinutes(currentSong.currentTime)} / 
        ${secondsToMinutes(currentSong.duration)}`;
    });
}

const updateSeekBar = () => {
    const seekBar = document.querySelector('.seekbar')
    const circle = document.querySelector('.circle')
    const progress = (currentSong.currentTime / currentSong.duration) * 100
    circle.style.left = progress + '%'
}

async function loadPlaylist(folder, autoplay = false) {
    // Get list of all songs in the specified folder
    songs = await getSongs(folder)
    console.log(songs)

    // Clear the existing song list
    let songUL = document.querySelector(".songlist ul")
    songUL.innerHTML = ''

    // Show all the songs in the playlist
    for (const song of songs) {
        let songName = decodeURIComponent(song.replace(".mp3", "")).split(" - ")[0];
        let artist = decodeURIComponent(song.replace(".mp3", "")).split(" - ")[1];

        let li = document.createElement("li")
        li.setAttribute("data-fullname", song)
        li.innerHTML = `
            <img class="invert" src="music.svg" alt="">
            <div class="info">
                <div>${songName}</div>
                <div>${artist}</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="play.svg" alt="">
            </div>`
        songUL.appendChild(li)

        // Attach click event listener to each song item
        li.addEventListener("click", function() {
            let fullSongName = li.getAttribute("data-fullname")
            if (fullSongName) {
                playMusic(fullSongName.trim(), true)
            } else {
                console.error("data-fullname attribute is missing")
            }
        })
    }

    // If there are songs and autoplay is true, start playing the first one automatically
    if (songs.length > 0) {
        playMusic(songs[0], autoplay);
    }
}

async function main() {
    // Load initial playlist with first song loaded but not autoplayed
    await loadPlaylist("songs/ncs", false)

    // Attach the play/pause event listener
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "pause.svg"
        } else {
            currentSong.pause()
            play.src = "play.svg"
        }
    })

    // Attach event listeners for seekbar interaction
    const seekBar = document.querySelector('.seekbar');
    seekBar.addEventListener("click", seek);
    seekBar.addEventListener("mousedown", startDragging);
    seekBar.addEventListener("mouseup", stopDragging);

    function seek(event) {
        if (currentSong) {
            const seekBarRect = seekBar.getBoundingClientRect();
            const clickPosition = event.clientX - seekBarRect.left;
            const newPosition = (clickPosition / seekBar.offsetWidth) * currentSong.duration;
            currentSong.currentTime = newPosition;
            updateSeekBar();
        }
    }

    let isDragging = false;
    function startDragging() {
        if (currentSong) {
            isDragging = true;
            document.addEventListener("mousemove", dragSeekBar);
            document.addEventListener("mouseup", stopDragging);
        }
    }

    function stopDragging() {
        if (isDragging) {
            document.removeEventListener("mousemove", dragSeekBar);
            isDragging = false;
        }
    }

    function dragSeekBar(event) {
        if (currentSong) {
            const seekBarRect = seekBar.getBoundingClientRect();
            const clickPosition = event.clientX - seekBarRect.left;
            const newPosition = (clickPosition / seekBar.offsetWidth) * currentSong.duration;
            currentSong.currentTime = newPosition;
            updateSeekBar();
        }
    }

    const updateSeekBar = () => {
        if (currentSong) {
            const seekBar = document.querySelector('.seekbar')
            const circle = document.querySelector('.circle')
            const progress = (currentSong.currentTime / currentSong.duration) * 100
            circle.style.left = progress + '%'
            document.querySelector(".songtime").innerHTML = 
                `${secondsToMinutes(currentSong.currentTime)} / ${secondsToMinutes(currentSong.duration)}`;
        }
    }

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "0"
    })

    // Add an event listener for close
    document.querySelector(".close").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "-120%"
    })

    // Add event listener to previous
    document.querySelector("#previous").addEventListener("click", ()=>{
        console.log("Previous clicked")

        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").slice(-1)[0]))
        if((index - 1) >= 0){
            playMusic(songs[index - 1], true)
        }
    })
    
    // Add event listener to next
    document.querySelector("#next").addEventListener("click", ()=>{
        console.log("Next clicked")

        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").slice(-1)[0]))
        if((index + 1) < songs.length){
            playMusic(songs[index + 1], true)
        }
    })

    // Add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e)=>{
        console.log(e, e.target, e.target.value)
        currentSong.volume = parseInt(e.target.value)/100
    })

    // Load the playlist whenever a card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        console.log(e)
        e.addEventListener("click", async item => {
            await loadPlaylist(`songs/${item.currentTarget.dataset.folder}`, true)
        })
    });

       // Add event listeners to sign up and log in buttons
       document.querySelector(".signupbtn").addEventListener("click", () => {
        alert("Feature Coming Soon!");
    });

    document.querySelector(".loginbtn").addEventListener("click", () => {
        alert("Feature Coming Soon!");
    });

    // // Add event listeners to home and search icons
    // document.querySelectorAll(".home li")[0].addEventListener("click", () => {
    //     alert("You are already at Home Menu!");
    // });

    // document.querySelectorAll(".search li")[1].addEventListener("click", () => {
    //     alert("sEARCH icon clicked!");
    // });

    const homeIcon = document.querySelector(".home ul li:nth-child(1)");
    const searchIcon = document.querySelector(".home ul li:nth-child(2)");

    homeIcon.addEventListener("click", () => {
        alert("You are already at Home menu");
    });

    searchIcon.addEventListener("click", () => {
        alert("Feature Coming Soon!");
    });

    //Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e=>{
        console.log(e.target)
        if(e.target.src.includes("volume.svg")){
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0
        }
        else{
            e.target.src = e.target.src.replace("mute.svg", "volume.svg")
            currentSong.volume = .1;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0
        }
    })

    var moonicon = document.getElementById("moonicon");

    moonicon.onclick = function() {
        document.body.classList.toggle("dark-theme");

        // Check if the "dark-theme" class is present after toggling
        if (document.body.classList.contains("dark-theme")) {
            moonicon.src = "sun.svg"; // Set the sun icon if dark theme is active
        } else {
            moonicon.src = "dark.svg"; // Set the moon icon if dark theme is not active
        }
    };
}

main();
