VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "ThisOutlookSession"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Private WithEvents Items As Outlook.Items
Attribute Items.VB_VarHelpID = -1
Private Sub Application_Startup()
         Dim objApp As Outlook.Application
         Dim objNameSpace As Outlook.NameSpace

         '        Get the items in the Inbox folder
         Set objApp = Outlook.Application
         Set objNameSpace = objApp.GetNamespace("MAPI")
         Set Items = objNameSpace.GetDefaultFolder(olFolderInbox).Folders("Ivanhoe Connect").Items
         Count = 1
End Sub
 
Private Sub Items_ItemAdd(ByVal objItem As Object)
         On Error GoTo ShowError

         Dim objMail As Outlook.MailItem
         
         Dim FileName As String
         FileName = "D:\Everything\Programming\GitHub\today\emails\Bulletin"
         ' & Format(DateTime.Now, "yyyyMMdd")
         ' & Format(Count, "000")
         '        Check if the item is a mail. If yes, then save it as a HTML file and update Count
         If TypeName(objItem) = "MailItem" Then
                   Set objMail = objItem
                   objMail.SaveAs FileName & ".html", olHTML
                   Count = Count + 1
         End If

         Exit Sub

ShowError:
         MsgBox Err.Number & " - " & Err.Description
End Sub
