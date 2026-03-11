let popup1 = document.getElementById("popup1");

function closePopup1(){
    popup1.classList.add("close-popup1");
}

let popup2 = document.getElementById("popup2");

function openPopup2(){
    popup2.classList.add("open-popup2");
}

function closePopup2(){
    popup2.classList.remove("open-popup2");
}

let popup3 = document.getElementById("popup3");

function openPopup3(){
    popup3.classList.add("open-popup3");
}

function closePopup3(){
    popup3.classList.remove("open-popup3");
}

let postpopup = document.getElementById("post-popup");

function openPostPopup(){
    postpopup.classList.add("open-postpopup");
}

function closePostPopup(){
    postpopup.classList.remove("open-postpopup");
}

let profilepopup = document.getElementById("profile-popup");

function openProfilePopup(){
    profilepopup.classList.add("open-profilepopup");
}

function closeProfilePopup(){
    profilepopup.classList.remove("open-profilepopup");
}

let photoFilenames = ["Images/DSC00924.JPG", "Images/DSC00967.JPG", "Images/DSC01359.JPG", "Images/DSC01371.JPG", "Images/DSC01365.JPG", "Images/DSC01408.JPG", "Images/DSC00014.JPG", "Images/DSC00024.JPG", "Images/DSC00143.JPG", "Images/DSC00146.JPG", "Images/DSC00149.JPG", "Images/DSC00150.JPG", "Images/DSC00152.JPG", "Images/DSC00160.JPG", "Images/DSC00200.JPG", "Images/DSC00203.JPG", "Images/DSC00204.JPG", "Images/DSC00209.JPG", "Images/DSC00250.JPG", "Images/DSC00261.JPG", "Images/DSC00263.JPG", "Images/DSC00264.JPG", "Images/DSC00265.JPG", "Images/DSC00266.JPG", "Images/DSC00268.JPG", "Images/DSC00271.JPG", "Images/DSC00273.JPG", "Images/DSC00276.JPG", "Images/DSC00280.JPG", "Images/DSC00283.JPG", "Images/DSC00284.JPG", "Images/DSC00290.JPG", "Images/DSC00292.JPG", "Images/DSC00295.JPG", "Images/DSC00301.JPG", "Images/DSC00304.JPG", "Images/DSC00324.JPG", "Images/DSC00326.JPG", "Images/DSC00329.JPG", "Images/DSC00335.JPG", "Images/DSC00338.JPG", "Images/DSC00342.JPG", "Images/DSC00347.JPG", "Images/DSC00350.JPG", "Images/DSC00356.JPG", "Images/DSC00607.JPG", "Images/DSC00611.JPG", "Images/DSC00728.JPG", "Images/DSC00735.JPG", "Images/DSC00739.JPG", "Images/DSC00743.JPG", "Images/DSC00747.JPG", "Images/DSC00756.JPG", "Images/DSC00759.JPG", "Images/DSC00783.JPG", "Images/DSC00799.JPG", "Images/DSC00807.JPG", "Images/DSC00811.JPG", "Images/DSC00814.JPG", "Images/DSC00828.JPG", "Images/DSC00854.JPG", "Images/DSC00901.JPG", "Images/DSC00905.JPG", "Images/DSC00909.JPG", "Images/DSC00911.JPG", "Images/DSC00914.JPG", "Images/DSC00916.JPG", "Images/DSC00918.JPG", "Images/DSC00921.JPG", "Images/DSC00924.JPG", "Images/DSC00926.JPG", "Images/DSC00928.JPG", "Images/DSC00929.JPG", "Images/DSC00930.JPG", "Images/DSC00932.JPG", "Images/DSC00935.JPG", "Images/DSC00937.JPG", "Images/DSC00939.JPG", "Images/DSC00942.JPG", "Images/DSC00943.JPG", "Images/DSC00946.JPG", "Images/DSC00948.JPG", "Images/DSC00950.JPG", "Images/DSC00959.JPG", "Images/DSC00962.JPG", "Images/DSC00965.JPG", "Images/DSC00967.JPG", "Images/DSC00973.JPG", "Images/DSC00984.JPG", "Images/DSC01010.JPG", "Images/DSC01207.JPG", "Images/DSC01223.JPG", "Images/DSC01274.JPG", "Images/DSC01301.JPG", "Images/DSC01321.JPG", "Images/DSC01359.JPG", "Images/DSC01360.JPG", "Images/DSC01365.JPG", "Images/DSC01369.JPG", "Images/DSC01371.JPG", "Images/DSC01373.JPG", "Images/DSC01374.JPG", "Images/DSC01391.JPG", "Images/DSC01399.JPG", "Images/DSC01408.JPG", "Images/DSC01433.JPG", "Images/DSC01727.JPG", "Images/DSC01794.JPG", "Images/DSC01798.JPG", "Images/DSC01836.JPG", "Images/DSC01853.JPG", ];

let counter = 0;

function change_text_male()
{
    document.getElementById("bio").innerHTML="Hello, I am Chris! I am a person with unique interests and talents.<br>Work hard every day and dream bigger. Stay focused and practice kindness. Always try your best.<br>Follow me and Scribt your life today!";
    document.getElementById("name").innerHTML="Chris";
    document.getElementById("username").innerHTML="@thenewestnumber";
    document.getElementById("followers").innerHTML="Followers: 390"
}

function change_text_female()
{
    document.getElementById("bio").innerHTML="Hello, I am Mary! I am a person with unique interests and talents.<br>Work hard every day and dream bigger. Stay focused and practice kindness. Always try your best.<br>Follow me and Scribt your life today!";
    document.getElementById("name").innerHTML="Mary";
    document.getElementById("username").innerHTML="@thenewestnumber";
    document.getElementById("followers").innerHTML="Followers: 390"
}

function makenewPfpMale(){
    let newPfpMale = document.getElementById("new-pfp-male");
    let defaultPfp = document.getElementById("default-pfp");
    defaultPfp.classList.add("changeold-pfp");
    newPfpMale.classList.add("makenew-pfp");
}

function makenewPfpFemale(){
    let newPfpFemale = document.getElementById("new-pfp-female");
    let defaultPfp = document.getElementById("default-pfp");
    defaultPfp.classList.add("changeold-pfp");
    newPfpFemale.classList.add("makenew-pfp");
}

function changeLabel(){
    const button = 
        document.querySelector('button');
    button.innerHTML = 'Profile Personalized';
}

function make_post(){
    // document.getElementById('myfiles').click();
    let photoGrid = document.getElementById("post-grid");
    let partOne = '<div class="post"><img src="';
    let partTwo = '"alt=""></div>';
    photoGrid.innerHTML = partOne + photoFilenames[counter] + partTwo + photoGrid.innerHTML;
    counter++;
    if (counter > 106) {
        counter = 0;
    }
}
